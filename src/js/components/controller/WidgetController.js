import GeolocationModal from '../editor/modal/GeolocationModal/GeolocationModal';
import RecordVideoModal from '../editor/modal/RecordVideoModal';
import { checkCoords, getStringCoords, getCoords } from '../utils/coords';

export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
    this.buffer = {};

    this.ws = new WebSocket(url.replace(/^http/, 'ws')); // создаем WebSocket по адресу 'ws://localhost:9000/'
  }

  init() {
    this.edit.drawWidget();
    this.edit.addInputListeners(this.onPressInput.bind(this));
    this.edit.addMediaListeners(this.onPressMedia.bind(this));

    this.getForms();
    this.addListenersForms();

    this.addListenersWS();
  }

  getForms() {
    // Инициализация модальных окон
    this.modals = {
      geoModal: new GeolocationModal(),
      // editModal: new EditModal(),
      // delModal: new DeleteModal(),
      // errModal: new ErrorModal(),
      recordModal: new RecordVideoModal(),
    };

    const parent = this.edit.container.querySelector('.widget');
    this.modals['geoModal'].drawModal(parent);
    this.modals['recordModal'].drawModal(parent);
  }

  getModal(modalName) {
    // Получение модального окна по имени ключа
    return this.modals[modalName];
  }

  addListenersForms() {
    // Добавление слушателей для элементов модальных окон
    const getModal = this.getModal('geoModal');
    getModal.addGeoModalListeners(this.submitGeoModal.bind(this));

    const recordModal = this.getModal('recordModal');
    recordModal.addRecordListeners(this.submitRecordModal.bind(this));
  }

  addListenersWS(type = 'ws open') {
    // Подключение событий для объекта WebSocket
    this.ws.addEventListener('open', (e) => console.log(type));

    this.ws.addEventListener('close', (e) => {
      console.log('ws close');
      setTimeout(() => {
        this.recoveryConnectWS();
      }, 5000);
    });

    this.ws.addEventListener('error', (e) => {
      console.log('ws error');
      ws.close();
    });

    this.ws.addEventListener('message', (e) => {
      console.log('***WS******message****');
      const obj = JSON.parse(e.data); // получение данных от сервера через WebSocket
      if (obj.status === 'connection') {
        // если первое подключение, то отрисовать все
        console.log('Первое подключение к серверу');
        for (let i = 0; i < obj.result.length; i += 1) {
          this.edit.drawMessage(obj.result[i]);
        }
      }
      if (obj.status === 'addMessage') {
        // отрисовать добавленное сообщение
        this.edit.drawMessage(obj.result);
      }
      if (obj.status === 'addVideo') {
        // отрисовать добавленное видео
        this.edit.drawMessage(obj.result, { type: 'video' });
      }
      if (obj.status === 'addAudio') {
        // отрисовать добавленное аудио
        this.edit.drawMessage(obj.result, { type: 'audio' });
      }
    });
  }

  recoveryConnectWS() {
    // Востановление соединения при сбое
    this.ws = new WebSocket(this.url.replace(/^http/, 'ws'));
    this.addListenersWS('Соединение ws востановлено');
  }

  async onPressInput() {
    // Callback - нажатие кнопки enter в поле ввода input виджета (отправка сообщения)
    const cords = await getCoords(); // получение координат
    if (!cords) {
      // если координат нет, то отрисовать модальное окно
      const modal = this.getModal('geoModal');
      modal.show();
      modal.input.focus();
      return;
    }
    const stringCords = getStringCoords(cords, 5);
    const form = this.edit.container.querySelector('.footer__form');
    const formData = new FormData(form);
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    this.edit.input.value = '';

    await fetch(`${this.url}/message`, {
      method: 'POST',
      body: formData,
    });
  }

  async requestAddMessage(stringCords, modal) {
    const formData = new FormData();
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    formData.append('content', this.edit.input.value);

    await fetch(`${this.url}/message`, {
      method: 'POST',
      body: formData,
    });
    modal.hide();
    this.edit.input.value = '';
  }

  async submitGeoModal(event) {
    // Callback - нажатие кнопки ОК в модальном окне Geolocation
    const modal = this.getModal('geoModal');
    const input = modal.input;
    if (input.validity.valueMissing) {
      // полю input назначаем не валидное состояние
      input.setCustomValidity('Укажите широту и долготу согласно образца');
      return;
    }
    const cords = checkCoords(input); // проверка шаблона ввода координат
    if (!cords) {
      return;
    }
    event.preventDefault();
    const stringCords = getStringCoords(cords, 5);
    if (this.buffer.formData) {
      this.buffer.formData.append('cords', stringCords);
      // console.log('нашли тип', this.buffer.formData.get('type'));
      const res = await fetch(`${this.url}/unload`, {
        method: 'POST',
        body: this.buffer.formData,
      });
      modal.hide();
      this.buffer = {};
      return;
    }
    this.requestAddMessage(stringCords, modal);
  }

  onPressMedia(event) {
    // Callback - нажатие на иконку микрофон/видеокамера
    const options = {
      video: event.target.className.includes('video'), // получение разрешения на пользование видео
      audio: true, // получение разрешения на пользование микрофоном
    };

    const connection = {
      modalCords: this.getModal('geoModal'),
      buffer: this.buffer,
    }

    const modal = this.getModal('recordModal');
    modal.show();
    modal.recordMedia(options, connection);
  }

  submitRecordModal() {
    // Callback - нажатие кнопки OK (сохранение аудио/видео записи)
    const modal = this.getModal('recordModal');
    modal.save = true;
    modal.urlServer = this.url;
    modal.recorder.stop(); // остановка записи видеопотока
    this.edit.input.value = '';
  }



  // ------------------------------------

  static onClickConteiner(event) {
    // Callback - нажали мышкой в поле контейнера input files
    const { target } = event;
    const parent = target.closest('.conteiner__frame');
    const input = parent.querySelector('.frame_input');
    // Назначаем полю input событие мыши click
    input.dispatchEvent(new MouseEvent('click'));
  }

  onChangeInput(event) {
    // В поле input выбрали фото и нажали открыть
    const { files } = event.target;
    if (!files) return;
    this.edit.conteiner.dispatchEvent(new Event('submit'));
    const cell = event.target;
    cell.value = ''; // Чтобы повторно открывать один и тот же файл
  }

  onSubmitForm() {
    // Отправка формы
    const body = new FormData(this.edit.conteiner); // Считывает поля name у элементов
    const xhr = new XMLHttpRequest();
    const method = 'method=addImages';

    xhr.addEventListener('load', this.callbackLoad.bind(this, xhr));

    xhr.open('POST', `http://localhost:9000?${method}`);
    xhr.send(body);
  }

  dropFiles(files) {
    // Отправка формы
    const formData = new FormData();
    for (const file of files) {
      console.log('наш файл', file);
      const { name } = file;
      formData.append('file', file, name);
    }
    const xhr = new XMLHttpRequest();
    const method = 'method=dropImages';

    xhr.addEventListener('load', this.callbackLoad.bind(this, xhr));

    xhr.open('POST', `http://localhost:9000?${method}`);
    xhr.send(formData);
  }
}

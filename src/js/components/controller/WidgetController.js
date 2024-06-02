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
    this.edit.addMicroListeners(this.onPressMicro.bind(this));
    this.edit.addVideoListeners(this.onPressVideo.bind(this));

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

    let parent = this.edit.container.querySelector('.widget');
    this.modals['geoModal'].drawModal(parent);
    
    parent = this.edit.container.querySelector('.widget');
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
        // отрисовать добавленное сообщение
        this.edit.drawMessage(obj.result, { type: 'video' });
      }
      if (obj.status === 'addAudio') {
        // отрисовать добавленное сообщение
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

  async requestAddMessage(stringCords, modal = null) {
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
    if (this.buffer.formData) {
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
      this.buffer.formData.append('cords', stringCords);
      console.log('наши тип', this.buffer.formData.get('type'));
      const res = await fetch(`${this.url}/unload/${this.buffer.formData.get('type')}`, {
        method: 'POST',
        body: this.buffer.formData,
      });
      modal.hide();
      return;
    }
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
    this.requestAddMessage(stringCords, modal);
    // const stringCords = getStringCoords(cords, 5);
    // const formData = new FormData();
    // formData.append('cords', stringCords);
    // formData.append('type', 'message');
    // formData.append('content', this.edit.input.value);

    // await fetch(`${this.url}/message`, {
    //   method: 'POST',
    //   body: formData,
    // });
    // modal.hide();
    // this.edit.input.value = '';
    // if (type === 'message') {
    //   this.edit.drawMessage(data);
    // }
    // if (type === 'audio') {
    //   this.edit.drawMedia(data, this.url, 'audio');
    // }
    // if (type === 'video') {
    //   this.edit.drawMedia(data, this.url, 'video');
    // }
  }

  onPressMicro(event) {
    // Callback - нажатие на иконку микрофон
    // const type = 'audio';
    const options = {
      audio: true, // получение разрешения на пользование микрофоном
    };

    const conect = {
      modalCords: this.getModal('geoModal'),
      buffer: this.buffer,
    };

    const modal = this.getModal('recordModal');
    const modalCords = this.getModal('geoModal');
    modal.show();
    modal.recordMedia(options, modalCords);
  }

  onPressVideo(event) {
    // Callback - нажатие на иконку видео
    const options = {
      video: true, // получение разрешения на пользование видео
      audio: true, // получение разрешения на пользование микрофоном
    };

    const conect = {
      modalCords: this.getModal('geoModal'),
      buffer: this.buffer,
    }

    const modal = this.getModal('recordModal');
    modal.show();
    modal.recordMedia(options, conect);
  }

  submitRecordModal() {
    // Callback - нажатие кнопки OK (сохранение аудио/видео записи)
    const modal = this.getModal('recordModal');
    modal.save = true;
    modal.urlServer = this.url;
    const cords = modal.recorder.stop(); // остановка записи видеопотока
    this.edit.input.value = '';
  }
}

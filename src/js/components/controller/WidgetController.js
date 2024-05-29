import GeolocationModal from '../editor/modal/GeolocationModal/GeolocationModal';
import RecordVideoModal from '../editor/modal/RecordVideoModal';
import { checkCoords, getStringCoords, getCoords } from '../utils/coords';

export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
    this.modal = null;
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
      console.log('***WS******message****', e.data);
      const obj = JSON.parse(e.data); // получение данных от сервера через WebSocket
      if (obj.status === 'connection') {
        // если первое подключение, то отрисовать все
        for (let i = 0; i < obj.result.length; i += 1) {
          this.edit.drawMessage(obj.result[i]);
        }
      }
      if (obj.status === 'addMessage') {
        // отрисовать добавленное сообщение
        this.edit.drawMessage(obj.result);
      }
    });
  }

  recoveryConnectWS() {
    // Востановление соединения при сбое
    this.ws = new WebSocket(this.url.replace(/^http/, 'ws'));
    this.addListenersWS('Соединение ws востановлено');
  }

  async onPressInput() {
    // Callback - нажатие кнопки enter в поле ввода input виджета
    const cords = await getCoords(); // получение координат
    if (!cords) {
      // если координат нет, то отрисовать модальное окно
      this.modal = this.getModal('geoModal');
      this.modal.show();
      this.modal.input.focus();
      return;
    }
    const stringCords = WidgetController.getStringCoords(cords, 5);
    const form = this.edit.container.querySelector('.footer__form');
    const formData = new FormData(form);
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    this.edit.input.value = '';

    await fetch(this.url, {
      method: 'POST',
      body: formData,
    });
  }

  async submitGeoModal(event) {
    // Callback - нажатие кнопки ОК в модальном окне Geolocation
    const input = this.modal.input;
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
    const formData = new FormData();
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    formData.append('content', this.edit.input.value);

    await fetch(this.url, {
      method: 'POST',
      body: formData,
    });
    this.modal.hide();
    this.modal = null;
    this.edit.input.value = '';
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
    // Callback - нажатие кнопки микрофон
    const type = 'audio';
    const options = {
      audio: true, // получение разрешения на пользование микрофоном
    };

    this.mediaProcessing(event, type, options);
  }

  onPressVideo(event) {
    // Callback - нажатие кнопки видео
    const type = 'video';
    const options = {
      video: true, // получение разрешения на пользование видео
      audio: true, // получение разрешения на пользование микрофоном
    };

    this.mediaProcessing(event, type, options);
  }

  changingButtons() {
    // Смена состояния кнопок
    this.edit.btnVideo.classList.toggle('hidden');
    this.edit.btnMicro.classList.toggle('hidden');
    this.edit.btnAccept.classList.toggle('hidden');
    this.edit.btnCancel.classList.toggle('hidden');
    this.edit.time.classList.toggle('hidden');
  }

  secundomer() {
    // метод вызываемый с помощью setTimeout
    this.time.seconds += 1;
    if (this.time.seconds === 60) {
      this.time.minutes += 1;
      this.time.seconds = 0;
      if (this.time.minutes === 60) {
        this.time.hours += 1;
        this.time.minutes = 0;
      }
    }

    const seconds = WidgetController.getStringTime(this.time.seconds);
    const minutes = WidgetController.getStringTime(this.time.minutes);
    const hours = WidgetController.getStringTime(this.time.hours);

    if (this.time.hours === 0) {
      this.edit.time.children[0].textContent = `${minutes}.${seconds}`;
    } else {
      this.edit.time.children[0].textContent = `${hours}.${minutes}.${seconds}`;
    }

    this.timerId = setTimeout(this.secundomer.bind(this), 1000); // зацикливание таймера
  }

  async mediaProcessing(event, type, options) {
    // Обработка запроса на запись аудио или видео
    const { target } = event;
    const parent = target.closest('.widget__footer');
    console.log('***1 video ***', parent)
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(options);
    } catch (error) {
      let message = null;
      if (type === 'audio') {
        message = 'У Вас нет разрешения на использование микрофона. Подключите микрофон и попробуйте заново.';
      } else {
        message = 'У Вас нет разрешения на использование вебкамеры или микрофона. Подключите устройства и попробуйте заново.';
      }
      // this.edit.drawPopupError(message);
      console.log('Рисуем попап нету видео или микрофона');
      return;
    }
    console.log('***2 video ***')
    this.edit.drawFieldMedia(parent, type);
    this.edit.media.srcObject = this.stream; // Отображаем медиапоток в теге
    // this.edit.media.play(); // ненужно
    // this.changingButtons(); // скрываем ненужные кнопки
    this.recorder = new MediaRecorder(this.stream); // нужен для записи медиапотока
    this.recorder.start();

    this.recorder.addEventListener('start', () => { // начало записи
      this.timerId = setTimeout(this.secundomer.bind(this), 1000);
    });

    this.recorder.addEventListener('dataavailable', (e) => { // получение данных
      this.chunks.push(e.data); // для сохранения кусков данных по медиа в наш массив
    });

    this.recorder.addEventListener('stop', async () => { // конец записи
      if (this.save) {
        const blob = new Blob(this.chunks); // получение двоичных данных по медиапотоку
        this.url = URL.createObjectURL(blob);

        const cords = await getCoords(); // получение координат
        if (!cords) {
          // this.edit.drawPopup(type); // если координат нет, то отрисовать окно
          console.log('попап с координатами');
          return;
        }
        const data = getStringCoords(cords, 5);

        // отправка запроса на сервер !!!!!!!!!!!!!!!!!!!
        // this.edit.drawMedia(data, this.url, type); // отрисовка медиа в ленту
        // this.save = false;
      }
    });

    // Событие когда тег видео получил доступ к данным
    this.edit.media.addEventListener('canplay', () => {
      // console.log('Нашлось видео');
      // this.edit.fieldVideo.play(); // запускаем воспроизведение видео в теге video
      // this.recorder.start(); // запуск записи видеопотока
      // this.timerId = setTimeout(this.secundomer.bind(this), 1000);
    });
  }
}

import BaseModal from '../../../base/BaseModal';
import recModalHtml from './recordVideoModal.html';
import { getStringCoords, getCoords } from '../../../utils/coords';

export default class RecordVideoModal extends BaseModal {
  constructor() {
    super('recordModal');
    this.submitListeners = [];
    this.media = null;
    this.timer = null;

    this.recorder = null;
    this.stream = null;
    this.timerId = null;
    this.chunks = []; // для сохранения данных (чанков) по видео
    this.save = false;
    this.urlServer = null;

    this.time = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    this.init();
  }

  init() {
    // Инициализация и сохранение модального окна
    const div = document.createElement('div');
    div.setAttribute('class', 'background-popup');
    div.dataset.type = 'background-recordModal';
    div.classList.add('hidden');
    div.insertAdjacentHTML('afterbegin', recModalHtml);
    this.bindToDOM(div);
  }

  getTagVideo() {
    return '<video class="video__box" autoplay="" muted name="file"></video>';
  }

  getTagAudio() {
    return '<audio class="audio__box" autoplay="" muted name="file"></audio>';
  }

  drawModal(parent) {
    // Отрисовка модального окна
    parent.append(this.container);
    this.timer = this.container.querySelector('.timer');

    const cancel = this.container.querySelector('.record__btn__cancel');

    cancel.addEventListener('click', () => this.clearData());
    this.getForm().addEventListener('submit', (o) => this.onSubmit(o));
  }

  addTagMedia(type) {
    // Добавляем тег audio/video в модальное окно
    const box = document.querySelector('.popup__media__box');
    box.innerHTML = (type === 'video') ? this.getTagVideo() : this.getTagAudio();
    this.media = box.firstChild;
    if (type === 'audio') {
      box.classList.add('media__box__background');
    }
    
    // Событие когда тег медиа получил доступ к данным
    this.media.addEventListener('canplay', () => {
      console.log('Подключен медиа поток');
      this.recorder.start(); // запуск записи видеопотока
      // this.media.play(); // play - запускаем воспроизведение видео в теге video 
      // или добавить в тег парметр autoplay=""
    });
  }

  async recordMedia(options, conect) {
    // Обработка записи медиа
    const typeMedia = options.video ? 'video' : 'audio';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(options);
    } catch (error) {
      let message = null;
      if (typeMedia === 'audio') {
        message = 'У Вас нет разрешения на использование микрофона. Подключите микрофон и попробуйте заново.';
      } else {
        message = 'У Вас нет разрешения на использование вебкамеры или микрофона. Подключите устройства и попробуйте заново.';
      }
      // this.edit.drawPopupError(message);
      console.log('Рисуем попап нету видео или микрофона');
      return;
    }

    this.addTagMedia(typeMedia);
    this.media.srcObject = this.stream; // Отображаем медиапоток в теге
    this.recorder = new MediaRecorder(this.stream); // нужен для записи медиапотока

    this.recorder.addEventListener('start', () => { // начало записи
      this.timerId = setTimeout(this.secundomer.bind(this), 1000);
    });

    this.recorder.addEventListener('dataavailable', (e) => { // получение данных
      this.chunks.push(e.data); // для сохранения кусков данных по медиа в наш массив
    });

    this.recorder.addEventListener('stop', async () => { // конец записи
      if (this.save) {
        const recordType = (typeMedia === 'audio') ? 'audio/wav' : 'video/webm';
        const blob = new Blob(this.chunks, { // получение двоичных данных по медиапотоку
          type: recordType,
        });
        const fileName = (typeMedia === 'video') ? 'record.webm' : 'audio.wav';
        const formData = new FormData();
        formData.append('file', blob, fileName);
        formData.append('type', typeMedia);

        const cords = await getCoords(); // получение координат
        if (!cords) {
        // если координат нет, то отрисовать модальное окно
          conect.buffer.formData = formData;
          this.clearData();
          conect.modalCords.show();
          conect.modalCords.input.focus();
          console.log('попап с координатами');
          return;
        }
        const data = getStringCoords(cords, 5);

        formData.append('cords', '34, 56');

        const res = await fetch(`${this.urlServer}/unload/${typeMedia}`, {
          method: 'POST',
          body: formData,
        });

        this.clearData();
      }
    });
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

    const seconds = RecordVideoModal.getStringNumber(this.time.seconds);
    const minutes = RecordVideoModal.getStringNumber(this.time.minutes);
    const hours = RecordVideoModal.getStringNumber(this.time.hours);

    if (this.time.hours === 0) {
      this.timer.textContent = `${minutes}.${seconds}`;
    } else {
      this.timer.textContent = `${hours}.${minutes}.${seconds}`;
    }

    this.timerId = setTimeout(this.secundomer.bind(this), 1000); // зацикливание таймера
  }

  static getStringNumber(number) {
    // Делает число двухзначным и преобразует в строку
    let num = String(number);
    if (num.length < 2) {
      num = `0${number}`;
    }
    return num;
  }

  clearData() {
    // Очищает данные после работы с аудио/видео записью
    this.stream.getTracks().forEach((track) => {
      track.stop(); // отключаем все дорожки видео потока
    });
    this.chunks = [];
    this.save = false;
    this.timer.textContent = '00.00';
    clearTimeout(this.timerId); // отключаем таймер
    this.time = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
    const box = document.querySelector('.popup__media__box');
    box.classList.remove('media__box__background');
    this.media.remove();
    this.hide();
    console.log('Данные очищены');
  }

  onSubmit(event) {
    // Вызывает callback при событии submit модального окна
    event.preventDefault();
    this.submitListeners.forEach((o) => o.call(null, event));
  }

  addRecordListeners(callback) {
    // Сохраняет callback для события submit
    this.submitListeners.push(callback);
  }
}

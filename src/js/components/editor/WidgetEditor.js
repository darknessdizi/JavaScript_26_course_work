import BaseWindowEditor from '../base/BaseWindowEditor';
import widgetHtml from './widget.html';
import messageHtml from './message/message.html';
import { convertTextToLinks, getNewFormatDate } from '../utils/utils';

export default class WidgetEditor extends BaseWindowEditor {
  constructor(container) {
    super();
    this.input = null;
    this.widgetField = null;
    this.popup = null;

    this.inputListeners = [];
    this.mediaListeners = [];
    this.inputFileListeners = [];

    this.bindToDOM(container);
  }

  drawWidget() {
    // Отрисовка поля виджета
    this.container.insertAdjacentHTML('afterbegin', widgetHtml);
    this.widgetField = this.container.querySelector('.widget__field');
    const form = this.container.querySelector('.footer__form');
    this.input = form.firstElementChild;
    this.input.focus();
    
    const btnFile = this.container.querySelector('.media__files');
    btnFile.addEventListener('click', (o) => {inputFile.click()}); // нажатие на поле inputFile

    const inputFile = this.container.querySelector('.field__input');
    inputFile.addEventListener('change', (event) => this.onChangeInput(event)); // В поле input выбрали фото и нажали открыть
    
    const formFile = this.container.querySelector('.form__media__input');
    formFile.addEventListener('submit', (event) => this.onSubmitForm(event));

    const btnVideo = this.container.querySelector('.media__video');
    const btnMicro = this.container.querySelector('.media__audio');
    btnVideo.addEventListener('click', (o) => this.onPressMedia(o));
    btnMicro.addEventListener('click', (o) => this.onPressMedia(o));
    form.addEventListener('submit', (o) => this.onPressInput(o));

    this.widgetField.addEventListener('dragover', (e) => {
      // Событие при переносе файлов из окна windows в браузер
      // Необходимо его сбросить
      console.log('dragover');
      e.preventDefault();
    });

    this.widgetField.addEventListener('drop', (e) => {
      // Событие при переносе файлов из окна windows в браузер
      // Необходимо его сбросить
      console.log('drop', e.dataTransfer.files);
      e.preventDefault();
      const { files } = e.dataTransfer;
      if (!files) return;
      // this.dropFiles(files);
      // отправка файлов
    });
  }

  getSpanTag() {
    return '<span class="message__text"></span>';
  }

  getVideoTag() {
    return '<video class="message__video" controls="controls" preload="none"></video>';
  }

  getAudioTag() {
    return '<audio class="message__audio" controls="controls" preload="none"></audio>';
  }

  drawMessage({ cords, content, id, timestamp, type } = {}) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message' });
    message.setAttribute('id', id);
    message.insertAdjacentHTML('afterbegin', messageHtml);

    const messageContent = message.querySelector('.message__content');
    let strHtml = null;
    if (type === 'message') {
      strHtml = this.getSpanTag();
      messageContent.innerHTML = strHtml;
      messageContent.firstChild.innerHTML = convertTextToLinks(content);
    }

    if (type === 'video') {
      strHtml = this.getVideoTag();
      messageContent.innerHTML = strHtml;
      messageContent.firstChild.src = `http://localhost:9000${content.path}`;
    }

    if (type === 'audio') {
      strHtml = this.getAudioTag();
      messageContent.innerHTML = strHtml;
      messageContent.firstChild.src = `http://localhost:9000${content.path}`;
    }

    const date = message.querySelector('.message__time');
    date.textContent = getNewFormatDate(timestamp);

    const fieldCords = message.querySelector('.coords');
    fieldCords.textContent = `[${cords}]`;

    const link = message.querySelector('.coords__link');
    const place = cords.replace(' ', '');
    link.setAttribute('href', `http://www.google.com/maps/place/${place}`);
  }

  onPressInput(event) {
    // Вызывает callback при нажатии Enter поля input
    event.preventDefault();
    if (this.input.value.length > 0) {
      this.inputListeners.forEach((o) => o.call(null));
    }
  }

  addInputListeners(callback) {
    // Сохраняет callback для поля input
    this.inputListeners.push(callback);
  }

  onPressMedia(event) {
    // Вызывает callback при нажатии иконки видео
    this.mediaListeners.forEach((o) => o.call(null, event));
  }

  addMediaListeners(callback) {
    this.mediaListeners.push(callback);
  }
}

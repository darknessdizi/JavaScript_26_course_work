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
    this.microListeners = [];
    this.videoListeners = [];

    this.bindToDOM(container);
  }

  drawWidget() {
    // Отрисовка поля виджета
    this.container.insertAdjacentHTML('afterbegin', widgetHtml);
    this.widgetField = this.container.querySelector('.widget__field');
    const form = this.container.querySelector('.footer__form');
    this.input = form.firstElementChild;
    this.input.focus();

    const btnVideo = this.container.querySelector('.media__video');
    const btnMicro = this.container.querySelector('.media__audio');

    btnVideo.addEventListener('click', (o) => this.onPressVideo(o));
    btnMicro.addEventListener('click', (o) => this.onPressMicro(o));
    form.addEventListener('submit', (o) => this.onPressInput(o));
  }

  drawMessage({ cords, content, id, timestamp } = {}) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message' });
    message.setAttribute('id', id);
    message.insertAdjacentHTML('afterbegin', messageHtml);

    const span = message.querySelector('.message__text');
    span.innerHTML = convertTextToLinks(content);

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

  onPressMicro(event) {
    // Вызывает callback при нажатии иконки микрофона
    this.microListeners.forEach((o) => o.call(null, event));
  }

  addMicroListeners(callback) {
    this.microListeners.push(callback);
  }

  onPressVideo(event) {
    // Вызывает callback при нажатии иконки видео
    this.videoListeners.forEach((o) => o.call(null, event));
  }

  addVideoListeners(callback) {
    this.videoListeners.push(callback);
  }
}

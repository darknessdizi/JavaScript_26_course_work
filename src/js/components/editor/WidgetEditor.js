import BaseWindowEditor from './BaseWindowEditor';
import widgetHtml from './widget.html';
import messageHtml from './message/message.html';

export default class WidgetEditor extends BaseWindowEditor {
  constructor(container) {
    super();
    this.input = null;
    this.widgetField = null;

    this.inputListeners = [];

    this.bindToDOM(container);
  }

  drawWidget() {
    // Отрисовка поля виджета
    this.container.insertAdjacentHTML('afterbegin', widgetHtml);
    this.widgetField = this.container.querySelector('.widget__field');
    const form = this.container.querySelector('.footer__form');
    this.input = form.firstElementChild;
    this.input.focus();

    form.addEventListener('submit', (o) => this.onPressInput(o));
  }

  drawMessage({ cords, content, id, timestamp } = {}) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message' });
    message.setAttribute('id', id);
    message.insertAdjacentHTML('afterbegin', messageHtml);

    const span = message.querySelector('.message__text');
    span.innerHTML = WidgetEditor.convertTextToLinks(content);

    const date = message.querySelector('.message__time');
    date.textContent = WidgetEditor.getNewFormatDate(timestamp);

    const fieldCords = message.querySelector('.coords');
    fieldCords.textContent = `[${cords}]`;

    const link = message.querySelector('.coords__link');
    const place = cords.replace(' ', '');
    link.setAttribute('href', `http://www.google.com/maps/place/${place}`);
  }

  static convertTextToLinks(text) {
    // Поиск и замена текста содержащего http/https на ссылку 
    const urlPattern = /\bhttps?:\/\/\S+/gi;
    return text.replace(urlPattern, function (url) {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }

  static getNewFormatDate(timestamp) {
    // возвращает новый формат даты и времени
    const start = new Date(timestamp);
    const year = String(start.getFullYear());
    const month = WidgetEditor._addZero(start.getMonth() + 1);
    const date = WidgetEditor._addZero(start.getDate());
    const hours = WidgetEditor._addZero(start.getHours());
    const minutes = WidgetEditor._addZero(start.getMinutes());
    const time = `${hours}:${minutes} ${date}.${month}.${year}`;
    return time;
  }

  static _addZero(number) {
    // делает число двухзначным
    let result = number;
    if (result < 10) {
      result = `0${result}`;
    }
    return result;
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
}

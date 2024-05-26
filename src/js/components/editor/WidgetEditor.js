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

  drawMessage(cords) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message' });
    message.insertAdjacentHTML('afterbegin', messageHtml);
    const span = message.querySelector('.message__text')
    span.textContent = this.input.value;
    // span.textContent = text;
    this.input.value = '';
    const time = Date.now();
    const date = message.querySelector('.message__time');
    date.textContent = WidgetEditor.getNewFormatDate(time);
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
    console.log('Нажали ввод');
    this.inputListeners.forEach((o) => o.call(null));
  }

  addInputListeners(callback) {
    // Сохраняет callback для поля input
    this.inputListeners.push(callback);
  }
}

  

//     this.link = this.container.querySelector('.header__link');
//     this.link.addEventListener('click', (event) => this.onLinkClick(event));
//   }

//   drawPopup() {
//     // Вставляем popup в наш виджет
//     const widget = this.container.querySelector('.widget');

//     const popup = WidgetEditor.addTagHTML(widget, { className: 'bacground__popup' });
//     popup.insertAdjacentHTML('afterbegin', popupHtml);

//     const content = widget.querySelector('.widget__content');
//     content.classList.add('popup__active');
//   }

//   drawArcticle({ title = '', image = '', description = '' } = {}) {
//     // Отрисовка новой статьи
//     const article = WidgetEditor.addTagHTML(this.articles, { className: 'article' });
//     article.insertAdjacentHTML('afterbegin', articlesHtml);

//     const articlesTitle = article.querySelector('.article__title');
//     const articlesImg = article.querySelector('.article__img');
//     const articlesDescription = article.querySelector('.article__description');

//     if (title) {
//       articlesTitle.textContent = title;
//     } else {
//       articlesTitle.classList.add('empty');
//     }

//     if (image) {
//       articlesImg.src = image;
//     } else {
//       articlesImg.classList.add('empty');
//     }

//     if (description) {
//       articlesDescription.textContent = description;
//     } else {
//       articlesDescription.classList.add('empty');
//     }
//   }

//   onLinkClick(event) {
//     // Вызов callback при нажатии ссылки обновить
//     event.preventDefault();
//     console.log('********* Нажали обновить *********');
//     this.linkListeners.forEach((o) => o.call(null));
//   }

//   addLinkListener(callback) {
//     // Сохранение callback для ссылки обновить
//     this.linkListeners.push(callback);
//   }
// }

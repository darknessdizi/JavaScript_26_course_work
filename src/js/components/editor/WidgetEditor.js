import BaseWindowEditor from '../base/BaseWindowEditor';
import widgetHtml from './widget.html';
import messageHtml from './message/message.html';
import { convertTextToLinks, getNewFormatDate } from '../utils/utils';

export default class WidgetEditor extends BaseWindowEditor {
  constructor(container, url) {
    super();
    this.serverUrl = url;
    this.input = null; // поле ввода чата
    this.widgetField = null; // размер поля с сообщениями
    this.statusFavorites = false; // режим отображения избранное
    this.scrollPositionDown = true; // скролл в нижней позиции
    this.scrollMoveDown = true; // движение скрола вниз
    this.scrollArrayLoad = []; // список загрузок для скрола

    this.inputListeners = [];
    this.mediaListeners = [];
    this.inputFileListeners = [];
    this.submitFileListeners = [];
    this.clickWidgetListeners = [];
    this.scrollWidgetListeners = [];
    this.clickFavoritesListeners = [];
    this.clickFilesListeners = [];
    this.clickMenuListeners = [];
    this.clickEmojiListeners = [];

    this.compareToDOM(container);
  }

  drawWidget() {
    // Отрисовка поля виджета
    this.container.insertAdjacentHTML('afterbegin', widgetHtml);
    this.widgetField = this.getWidgetField();
    const formInput = this.container.querySelector('.footer__form');
    this.input = formInput.firstElementChild;
    this.input.focus();

    const btnMenu = this.container.querySelector('.controll__menu');
    btnMenu.addEventListener('click', (o) => this.onClickMenu(o));

    const divFavorites = this.container.querySelector('.controll__favorites');
    divFavorites.addEventListener('click', (o) => this.onClickFavorites(o));
    const divFiles = this.container.querySelector('.controll__files');
    divFiles.addEventListener('click', (o) => this.onClickFiles(o));

    const inputFiles = this.container.querySelector('.field__input');
    // В поле inputFiles выбрали файл и нажали открыть:
    inputFiles.addEventListener('change', (o) => this.onChangeInput(o));

    const btnFile = this.container.querySelector('.media__files');
    // нажатие на поле добавления файлов (скрепка):
    btnFile.addEventListener('click', () => inputFiles.click());

    const formFiles = this.getformInputFile();
    formFiles.addEventListener('submit', (o) => this.onSubmitFileForm(o));

    const btnVideo = this.container.querySelector('.media__video');
    const btnMicro = this.container.querySelector('.media__audio');
    btnVideo.addEventListener('click', (o) => this.onPressMedia(o));
    btnMicro.addEventListener('click', (o) => this.onPressMedia(o));
    formInput.addEventListener('submit', (o) => this.onPressInput(o));
    this.widgetField.addEventListener('click', (o) => this.onClickWidget(o));
    this.widgetField.addEventListener('scroll', (o) => this.onScrollWidget(o));

    const btnEmoji = this.container.querySelector('.footer__smiles');
    btnEmoji.addEventListener('click', (o) => this.onPressEmoji(o));
  }

  getFieldFiles() {
    return this.container.querySelector('.field__fiels');
  }

  getTypeFiles(type) {
    return this.container.querySelector(`.fiels__type__${type}`);
  }

  getDivFavorites() {
    return this.container.querySelector('.controll__favorites');
  }

  static findID(id) {
    return document.getElementById(id);
  }

  getformInputFile() {
    return this.container.querySelector('.form__media__input');
  }

  getWidgetField() {
    return this.container.querySelector('.widget__field');
  }

  static getSpanTag() {
    return '<span class="message__text"></span>';
  }

  static getVideoTag() {
    return '<video class="message__video" controls="controls" preload="none"></video>';
  }

  static getAudioTag() {
    return '<audio class="message__audio" controls="controls" preload="none"></audio>';
  }

  static getImgTag() {
    return '<img src="" alt="Изображение" class="message__image">';
  }

  static getItemStar(parent) {
    return parent.querySelector('.message__controll__star');
  }

  static getFileDiv() {
    return `
      <div class="message__file"></div>
      <span class="message__file__title"></span>
    `;
  }

  static getLinkDownload(name) {
    return `<div class="message__controll__download" data-name=${name}></div>`;
  }

  static changeFavorite({ id, favorite } = {}) {
    // Замена статуса сообщения (избранное)
    const element = WidgetEditor.findID(id);
    const star = WidgetEditor.getItemStar(element);
    if (favorite) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  }

  static deleteMessage({ id } = {}) {
    // Удаляет сообщение из виджета по номеру id
    const element = WidgetEditor.findID(id);
    element.remove();
  }

  scrollPage() {
    // Метод прокручивает положение скрола до самого нижнего края виджета
    if (this.scrollPositionDown) {
      this.widgetField.scrollTop = this.widgetField.scrollHeight;
    }
  }

  drawMessage({
    cords, content, id,
    timestamp, type, favorite,
    append = true,
  } = {}) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message', append });
    message.setAttribute('id', id);
    message.insertAdjacentHTML('afterbegin', messageHtml);

    if (favorite) {
      const star = WidgetEditor.getItemStar(message);
      star.classList.add('active');
    }

    const messageContent = message.querySelector('.message__content');
    let strHtml = null;
    if (type === 'message') {
      strHtml = WidgetEditor.getSpanTag();
      messageContent.innerHTML = strHtml;
      messageContent.firstChild.innerHTML = convertTextToLinks(content);
    } else {
      const download = WidgetEditor.getLinkDownload(content.name);
      const iconStar = message.querySelector('.message__controll__star');
      iconStar.insertAdjacentHTML('afterend', download); // Добавили ярлык загрузки после звезды

      if (type === 'video') {
        strHtml = WidgetEditor.getVideoTag();
      } else if (type === 'audio') {
        strHtml = WidgetEditor.getAudioTag();
      } else if (type === 'image') {
        strHtml = WidgetEditor.getImgTag();
        this.scrollArrayLoad.push(true);
      } else {
        strHtml = WidgetEditor.getFileDiv();
      }

      messageContent.innerHTML = strHtml;
      const findType = ['audio', 'video', 'image'].includes(type);
      if (findType) {
        messageContent.firstChild.src = `${this.serverUrl}${content.path}`;
        messageContent.firstChild.addEventListener('load', () => {
          setTimeout(() => {
            this.scrollArrayLoad.pop();
            if (this.scrollArrayLoad.length === 0) {
              this.scrollMoveDown = true;
            }
          }, 0);
          this.scrollPage();
        });
      } else {
        messageContent.lastElementChild.textContent = content.originalName;
      }
    }

    const date = message.querySelector('.message__time');
    date.textContent = getNewFormatDate(timestamp);

    const fieldCords = message.querySelector('.coords');
    fieldCords.textContent = `[${cords}]`;

    const link = message.querySelector('.coords__link');
    const place = cords.replace(' ', '');
    link.setAttribute('href', `http://www.google.com/maps/place/${place}`);
    this.scrollPage();
  }

  resetFavorites() {
    // Сбросить режим отображения избранного
    this.statusFavorites = false;
    const div = this.getDivFavorites();
    div.classList.remove('favorites__active');
    div.firstElementChild.textContent = 'Избранное';
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
    // Сохраняет callback для полей микрофон/видеокамера
    this.mediaListeners.push(callback);
  }

  onChangeInput(event) {
    // Вызывает callback при нажатии открыть в поле inputFile
    this.inputFileListeners.forEach((o) => o.call(null, event));
  }

  addInputFileListeners(callback) {
    // Сохраняет callback для поля inputFile
    this.inputFileListeners.push(callback);
  }

  onSubmitFileForm(event) {
    // Вызывает callback при нажатии отправке формы с файлами (скрепка)
    this.submitFileListeners.forEach((o) => o.call(null, event));
  }

  addSubmitFileListeners(callback) {
    // Сохраняет callback для отправки формы с файлами поля inputFile
    this.submitFileListeners.push(callback);
  }

  onClickWidget(event) {
    // Вызывает callback при нажатии в поле виджета (поле отображения файлов)
    this.clickWidgetListeners.forEach((o) => o.call(null, event));
  }

  addClickWidgetListeners(callback) {
    // Сохраняет callback события при нажатии в поле виджета (поле отображения файлов)
    this.clickWidgetListeners.push(callback);
  }

  onScrollWidget(event) {
    // Вызывает callback при прокрутке поля виджета
    this.scrollWidgetListeners.forEach((o) => o.call(null, event));
  }

  addScrollWidgetListeners(callback) {
    // Сохраняет callback события прокрутки поля виджета
    this.scrollWidgetListeners.push(callback);
  }

  onClickFavorites(event) {
    // Вызывает callback при нажатии кнопки избранное
    this.clickFavoritesListeners.forEach((o) => o.call(null, event));
  }

  addClickFavoritesListeners(callback) {
    // Сохраняет callback события при нажатии кнопки избранное
    this.clickFavoritesListeners.push(callback);
  }

  onClickFiles(event) {
    // Вызывает callback при нажатии кнопки файлы
    this.clickFilesListeners.forEach((o) => o.call(null, event));
  }

  addClickFilesListeners(callback) {
    // Сохраняет callback события при нажатии кнопки файлы
    this.clickFilesListeners.push(callback);
  }

  onClickMenu(event) {
    // Вызывает callback при нажатии кнопки меню
    this.clickMenuListeners.forEach((o) => o.call(null, event));
  }

  addClickMenuListeners(callback) {
    // Сохраняет callback события при нажатии кнопки меню
    this.clickMenuListeners.push(callback);
  }

  onPressEmoji(event) {
    // Вызывает callback при нажатии кнопки эмоджи
    this.clickEmojiListeners.forEach((o) => o.call(null, event));
  }

  addEmojiListeners(callback) {
    // Сохраняет callback события при нажатии кнопки меню
    this.clickEmojiListeners.push(callback);
  }
}

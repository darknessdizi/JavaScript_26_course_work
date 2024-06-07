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
    this.statusFavorites = false;
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
    btnMenu.addEventListener('click', () => {
      this.controllMenu();
    });

    const divFavorites = this.container.querySelector('.controll__favorites');
    divFavorites.addEventListener('click', (o) => this.onClickFavorites(o));
    const divFiles = this.container.querySelector('.controll__files');
    divFiles.addEventListener('click', (o) => this.onClickFiles(o));
    
    const btnFile = this.container.querySelector('.media__files');
    // нажатие на поле добавления файлов (скрепка):
    btnFile.addEventListener('click', () => inputFiles.click());

    const inputFiles = this.container.querySelector('.field__input');
    // В поле inputFiles выбрали файл и нажали открыть:
    inputFiles.addEventListener('change', (o) => this.onChangeInput(o));
    
    const formFiles = this.getformInputFile();
    formFiles.addEventListener('submit', (o) => this.onSubmitFileForm(o));

    const btnVideo = this.container.querySelector('.media__video');
    const btnMicro = this.container.querySelector('.media__audio');
    btnVideo.addEventListener('click', (o) => this.onPressMedia(o));
    btnMicro.addEventListener('click', (o) => this.onPressMedia(o));
    formInput.addEventListener('submit', (o) => this.onPressInput(o));
    this.widgetField.addEventListener('click', (o) => this.onClickWidget(o));
    this.widgetField.addEventListener('scroll', (o) => this.onScrollWidget(o));
  }

  controllMenu() {
    // Callback - нажатия на кнопку меню
    const menu = this.container.querySelector('.widget__menu');
    const field = this.container.querySelector('.widget__field');
    const btnMenu = this.container.querySelector('.controll__menu');
    if (menu.className.includes('widget__menu__active')) {
      menu.classList.remove('widget__menu__active');
      field.classList.remove('widget__field__mini');
      btnMenu.classList.remove('controll__menu__active');
      const files = this.container.querySelector('.field__fiels');
      files.classList.add('hidden');
      const btnFiles = this.container.querySelector('.controll__files');
      if (btnFiles.className.includes('controll__files__active')) {
        btnFiles.classList.remove('controll__files__active');
        btnFiles.firstElementChild.textContent = 'Файлы';
      }
    } else {
      menu.classList.add('widget__menu__active');
      field.classList.add('widget__field__mini');
      btnMenu.classList.add('controll__menu__active');
    }
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

  findID(id) {
    return document.getElementById(id);
  }

  getformInputFile() {
    return this.container.querySelector('.form__media__input');
  }

  getWidgetField() {
    return this.container.querySelector('.widget__field');
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

  getImgTag() {
    return '<img src="" alt="Изображение" class="message__image">';
  }

  getItemStar(parent) {
    return parent.querySelector('.message__controll__star');
  }

  changeFavorite({ id, favorite } = {}) {
    // Замена статуса сообщения (избранное)
    const element = this.findID(id);
    const star = this.getItemStar(element);
    if (favorite) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  }

  deleteMessage({ id } = {}) {
    // Удаляет сообщение из виджета по номеру id
    const element = this.findID(id);
    element.remove();
  }

  scrollPage() {
    // Метод прокручивает положение скрола до самого нижнего края виджета
    if (this.scrollPositionDown) {
      this.widgetField.scrollTop = this.widgetField.scrollHeight;
    }
  }
  
  drawMessage({ cords, content, id, timestamp, type, favorite, append = true } = {}) {
    // Метод добавляет сообщение в поле виджета
    const message = WidgetEditor.addTagHTML(this.widgetField, { className: 'widget__field__message', append });
    message.setAttribute('id', id);
    message.insertAdjacentHTML('afterbegin', messageHtml);

    if (favorite) {
      const star = this.getItemStar(message);
      star.classList.add('active');
    }

    const messageContent = message.querySelector('.message__content');
    let strHtml = null;
    if (type === 'message') {
      strHtml = this.getSpanTag();
      messageContent.innerHTML = strHtml;
      messageContent.firstChild.innerHTML = convertTextToLinks(content);
    } else {
      if (type === 'video') {
        strHtml = this.getVideoTag();
      }
      if (type === 'audio') {
        strHtml = this.getAudioTag();
      }
      if (type === 'image') {
        strHtml = this.getImgTag();
        this.scrollArrayLoad.push(true);
      }

      messageContent.innerHTML = strHtml;
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
}

import BaseWindowEditor from '../base/BaseWindowEditor';
import widgetHtml from './widget.html';
import messageHtml from './message/message.html';
import { convertTextToLinks, getNewFormatDate } from '../utils/utils';

export default class WidgetEditor extends BaseWindowEditor {
  constructor(container) {
    super();
    this.input = null;
    this.widgetField = null;
    this.statusScroll = true;
    this.scrollMove = true;
    this.scrollStatusLoad = [];
    this.position = 0;

    this.inputListeners = [];
    this.mediaListeners = [];
    this.inputFileListeners = [];
    this.submitFileListeners = [];
    this.clickWidgetListeners = [];
    this.scrollWidgetListeners = [];

    this.compareToDOM(container);
    this.count = 0;
  }

  drawWidget() {
    // Отрисовка поля виджета
    this.container.insertAdjacentHTML('afterbegin', widgetHtml);
    this.widgetField = this.getWidgetField();
    const formInput = this.container.querySelector('.footer__form');
    this.input = formInput.firstElementChild;
    this.input.focus();
    
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
    if (this.statusScroll) {
      // console.log('Успешно скроллим вниз !!!!!!!')
      this.widgetField.scrollTop = this.widgetField.scrollHeight;
    }
  }
  
  drawMessage({ cords, content, id, timestamp, type, url, favorite, append = true } = {}) {
    // Метод добавляет сообщение в поле виджета
    // console.log('получено сообщение\nБыло\n', 'scrollTop=', this.widgetField.scrollTop, 'scrollHeight=', this.widgetField.scrollHeight, 'position', this.position)
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
      }
      const fullUrl = `${url}${content.path}`;
      this.scrollStatusLoad.push(true);

      messageContent.innerHTML = strHtml;
      messageContent.firstChild.src = fullUrl;
      messageContent.firstChild.addEventListener('load', (event) => {
        this.count += 1;
        // const timeFile = event.timeStamp;
        // this.scrollStatusLoad.findIndex((item) => { item.key })
        // this.scrollStatusLoad.push(timeFile);
        // console.log('получено изображение', event)
        // console.log('получено изображение', this.count, 'scrollTop=', this.widgetField.scrollTop, 'scrollHeight=', this.widgetField.scrollHeight, 'position', this.position)
        setTimeout(() => {
          // console.log('Таймер изображения', this.count, 'scrollTop=', this.widgetField.scrollTop, 'scrollHeight=', this.widgetField.scrollHeight, 'position', this.position)
          // const index = this.scrollStatusLoad.indexOf(timeFile);
          // this.scrollStatusLoad.splice(index, 1);
          this.scrollStatusLoad.pop();
          if (this.scrollStatusLoad.length === 0) {
            console.log('+++++++++++++++++++++++++++++')
            this.scrollMove = true;
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
    // console.log('Стало\n', 'scrollTop=', this.widgetField.scrollTop, 'scrollHeight=', this.widgetField.scrollHeight, 'position', this.position)
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
}

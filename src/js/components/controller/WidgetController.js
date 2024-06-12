import GeolocationModal from '../editor/modal/GeolocationModal';
import RecordModal from '../editor/modal/RecordModal';
import ErrorModal from '../editor/modal/ErrorModal';
import { checkCoords, getStringCoords, getCoords } from '../utils/coords';
import { countLinks } from '../utils/utils';
import SMILES from '../utils/const';

export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
    this.buffer = {};
    this.generator = null;
    this.arrayMessage = null;
    this.allMessage = null;
    this.stap = 0;

    this.ws = new WebSocket(url.replace(/^http/, 'ws')); // создаем WebSocket по адресу 'ws://localhost:9000/'
  }

  init() {
    this.edit.drawWidget();
    this.edit.addInputListeners(this.onPressInput.bind(this));
    this.edit.addMediaListeners(this.onPressMedia.bind(this));
    this.edit.addInputFileListeners(this.onChangeInput.bind(this));
    this.edit.addSubmitFileListeners(this.onSubmitFileForm.bind(this));
    this.edit.addClickWidgetListeners(this.onClickWidget.bind(this));
    this.edit.addScrollWidgetListeners(this.onScrollWidget.bind(this));
    this.edit.addClickFavoritesListeners(this.onClickFavorites.bind(this));
    this.edit.addClickFilesListeners(this.onClickFiles.bind(this));
    this.edit.addClickMenuListeners(this.onClickMenu.bind(this));
    this.edit.addEmojiListeners(this.onPressEmoji.bind(this));

    this.getForms();
    this.addListenersForms();

    this.addListenersWS();

    // Событие при переносе файлов из окна windows в браузер необходимо его сбросить:
    this.edit.widgetField.addEventListener('dragover', (e) => e.preventDefault());
    this.edit.widgetField.addEventListener('drop', (e) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      if (!files) return;
      this.dropFiles(files);
    });

    setInterval(() => {
      this.ws.send(JSON.stringify({ echo: true }))
    }, 3000);
  }

  getForms() {
    // Инициализация модальных окон
    this.modals = {
      geoModal: new GeolocationModal(),
      // editModal: new EditModal(),
      // delModal: new DeleteModal(),
      errorModal: new ErrorModal(),
      recordModal: new RecordModal(),
    };

    const parent = this.edit.container.querySelector('.widget');
    this.modals.geoModal.drawModal(parent);
    this.modals.recordModal.drawModal(parent);
    this.modals.errorModal.drawModal(parent);
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
    this.ws.addEventListener('open', () => console.log(type));

    this.ws.addEventListener('close', () => {
      console.log('ws close');
      setTimeout(() => this.recoveryConnectWS(), 5000);
    });

    this.ws.addEventListener('error', () => {
      console.log('ws error');
    });

    this.ws.addEventListener('message', async (e) => {
      // console.log('*** WS *** новое *** message ***');
      // получение данных от сервера через WebSocket:
      const obj = await JSON.parse(e.data);

      if (obj.status === 'connection') {
        // если первое подключение, то отрисовать все
        console.log('Новое подключение к серверу');
        if (this.edit.statusFavorites) {
          this.edit.resetFavorites();
        }

        // генератор для ленивой подгрузки:
        this.allMessage = obj.result.slice();
        this.generator = this.generatorMessages(10);
        const result = this.generator.next().value;
        for (let i = 0; i < result.length; i += 1) {
          const item = this.edit.constructor.findID(result[i].id);
          if (!item) {
            this.edit.drawMessage(result[i]);
          }
        }
        return;
      }

      if (obj.status === 'echo') {
        console.log('Связь с сервером в наличии');
      }

      if (obj.status === 'changeFavorite') { // команда на смену статуса сообщения
        if ((this.edit.statusFavorites) && (obj.result.favorite)) {
          // Добавляет избранное сообщение в чат в режиме избранное
          const result = await this.request({ path: `getMessage/${obj.result.id}`, method: 'GET' });
          const json = await result.json();
          this.edit.drawMessage(json);
        } else if ((this.edit.statusFavorites) && (!obj.result.favorite)) {
          // Удаляет сообщение в режиме избранное, если оно сменило статус
          this.edit.constructor.deleteMessage(obj.result);
        } else {
          // Меняет статус сообщения
          const element = this.edit.constructor.findID(obj.result.id);
          if (element) {
            this.edit.constructor.changeFavorite(obj.result);
          } else {
            const index = this.allMessage.findIndex((item) => item.id === obj.result.id);
            this.allMessage[index].favorite = obj.result.favorite;
          }
        }
        return;
      }

      if (obj.status === 'deleteMessage') { // команда на удаление сообщения
        const index = this.allMessage.findIndex((item) => item.id === obj.result.id);
        this.allMessage.splice(index, 1);
        // console.log('в массиве', this.allMessage);

        const element = this.edit.constructor.findID(obj.result.id);
        if (element) { // Проверяем отрисован элемент или нет
          this.edit.constructor.deleteMessage(obj.result);
          if (obj.result.type === 'message') {
            const count = countLinks(obj.result.content);
            if (count > 0) {
              this.replaceCount('links', -count);
              this.replaceCount('all', -count);
            }
          } else {
            this.replaceCount(obj.result.type, -1);
            this.replaceCount('all', -1);
          }
        }
        if (this.edit.widgetField.scrollHeight === this.edit.widgetField.clientHeight) {
          // догружаем файлы, если их мало в поле сообщений
          const result = this.generator.next().value;
          if (result) {
            result.reverse();
            for (let i = 0; i < result.length; i += 1) {
              const item = this.edit.constructor.findID(result[i].id);
              if (!item) {
                result[i].append = false;
                this.edit.drawMessage(result[i]);
              }
            }
          }
        }
        return;
      }

      // Отрисовка все поступивших сообщений
      if (!this.edit.statusFavorites) {
        for (let i = 0; i < obj.length; i += 1) {
          this.edit.drawMessage(obj[i]);
          if (obj[i].type === 'message') {
            const count = countLinks(obj[i].content);
            if (count > 0) {
              this.replaceCount('links', count);
              this.replaceCount('all', count);
            }
          } else {
            this.replaceCount(obj[i].type, 1);
            this.replaceCount('all', 1);
          }
        }
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
      return;
    }
    const stringCords = getStringCoords(cords, 5);
    const form = this.edit.container.querySelector('.footer__form');
    const formData = new FormData(form);
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    this.edit.input.value = '';

    await this.request({ path: 'message', method: 'POST', body: formData });
  }

  async requestAddMessage(stringCords, modal) {
    const formData = new FormData();
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    formData.append('content', this.edit.input.value);

    await this.request({ path: 'message', method: 'POST', body: formData });
    modal.hide();
    this.edit.input.value = '';
  }

  async submitGeoModal(event) {
    // Callback - нажатие кнопки ОК в модальном окне Geolocation
    const modal = this.getModal('geoModal');
    const { input } = modal;
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
    modal.bufferCords = stringCords;
    if (this.buffer.drop) {
      for (const formData of this.buffer.drop) {
        formData.append('cords', stringCords);
        this.request({ path: 'upload', method: 'POST', body: formData });
      }
      modal.hide();
      this.buffer = {};
      return;
    }
    if (this.buffer.formData) {
      this.buffer.formData.append('cords', stringCords);
      await this.request({ path: 'upload', method: 'POST', body: this.buffer.formData });
      modal.hide();
      this.buffer = {};
      return;
    }
    this.requestAddMessage(stringCords, modal);
  }

  onPressMedia(event) {
    // Callback - нажатие на иконку микрофон/видеокамера
    const options = {
      video: event.target.className.includes('video'), // получение разрешения на пользование видео
      audio: true, // получение разрешения на пользование микрофоном
    };

    const connection = {
      modalCords: this.getModal('geoModal'),
      modalError: this.getModal('errorModal'),
      buffer: this.buffer,
    };

    const modal = this.getModal('recordModal');
    modal.show();
    modal.recordMedia(options, connection);
  }

  submitRecordModal() {
    // Callback - нажатие кнопки OK (сохранение аудио/видео записи)
    const modal = this.getModal('recordModal');
    const btn = modal.getBtnOk();
    if (btn.className.includes('noactive')) {
      return;
    }
    modal.save = true;
    modal.urlServer = this.url;
    modal.recorder.stop(); // остановка записи видеопотока
    this.edit.input.value = '';
  }

  onChangeInput(event) {
    // В поле input выбрали фото и нажали открыть
    const { files } = event.target;
    if (!files) return;
    const form = this.edit.getformInputFile();
    form.dispatchEvent(new Event('submit'));
    const cell = event.target;
    cell.value = ''; // Чтобы повторно открывать один и тот же файл
  }

  async onSubmitFileForm() {
    // Отправка формы поля inputFile (скрепка)
    const form = this.edit.getformInputFile();
    const formData = new FormData(form); // Считывает поля name у элементов

    const cords = await getCoords(); // получение координат
    if (!cords) {
      // если координат нет, то отрисовать модальное окно
      this.buffer.formData = formData;
      const modal = this.getModal('geoModal');
      modal.show();
      return;
    }

    const stringCoords = getStringCoords(cords, 5);
    formData.append('cords', stringCoords);
    await this.request({ path: 'upload', method: 'POST', body: formData });
  }

  async dropFiles(files) {
    // Бросаем файлы в поле виджета (событие Drop)
    let inspect = false;
    let cords = await getCoords(); // получение координат
    if (!cords) {
      // если координат нет, то отрисовать модальное окно
      const modal = this.getModal('geoModal');
      if (modal.bufferCords) {
        cords = modal.bufferCords;
        inspect = true;
      } else {
        this.buffer.drop = [];
        for (const file of files) {
          const formData = new FormData();
          const { name } = file;
          formData.append('file', file, name);
          this.buffer.drop.push(formData);
        }
        modal.show();
        return;
      }
    }

    const stringCoords = (inspect) ? cords : getStringCoords(cords, 5);

    for (const file of files) {
      const formData = new FormData();
      const { name } = file;
      formData.append('file', file, name);
      formData.append('cords', stringCoords);

      this.request({ path: 'upload', method: 'POST', body: formData });
    }
  }

  async onClickWidget(event) {
    // Callback - click мышкой в поле виджета (поле отображения сообщений)
    const { target } = event;
    if (target.className.includes('message__controll__star')) {
      // Нажали на звезду (статус избранное)
      const status = !target.className.includes('active');
      const parent = target.closest('.widget__field__message');
      await this.request({
        path: `favorites/${parent.id}`,
        method: 'PATCH',
        body: JSON.stringify({ favorite: status }),
      });
    }
    if (target.className.includes('message__controll__delete')) {
      // Нажали иконку удалить
      const parent = target.closest('.widget__field__message');
      // const span = parent.querySelector('.message__text');
      // console.log(`Удалено ${span.textContent}`)
      this.stap += 1;
      await this.request({ path: `delete/${parent.id}`, method: 'DELETE' });
    }
  }

  * generatorMessages(number) {
    // Генератор выдачи списка сообщений в количестве равном number
    let count = 0;
    let result = [];
    const maxLength = this.allMessage.length;
    if (maxLength === 0) {
      // console.log('maxLength = 0')
      this.stap = 0;
      return result;
    }
    for (let i = 0; i < maxLength; i += 1) {
      const index = this.allMessage.length - 1;
      if (index - i + this.stap < 0) {
        this.stap = 0;
        return result.reverse();
      }
      count += 1;
      result.push(this.allMessage[index - i + this.stap]);
      // if (this.allMessage[index - i + this.stap]) {
      //   console.log(`рисуем ${index} - ${i} + ${this.stap} = ${index - i + this.stap}
      // это "${this.allMessage[index - i + this.stap].content}"`);
      // } else {
      //   console.log(`рисуем ${index} - ${i} + ${this.stap} = ${index - i + this.stap}
      // это undefinet`);
      // }
      if (count === number) {
        yield result.reverse(); // возвращает список из 10 элементов
        result = [];
        count = 0;
      }
    }
    this.stap = 0;
    // console.log('конец цикла');
    return result.reverse();
  }

  onScrollWidget(event) {
    // Метод определяет движение/удержание скрола при загрузке файлов

    /*
    Складываем высоту от верхнего края виджета
    до видимой части с высотой видимой части.
    scrollHeight - это высота до нижнего край нашей позиции у виджета
    */
    const scrollHeight = this.edit.widgetField.scrollTop + event.target.clientHeight;
    if (this.edit.scrollMoveDown) {
      if ((scrollHeight + 1 >= this.edit.widgetField.scrollHeight)
        || (this.edit.scrollArrayLoad.length > 0)
      ) {
        this.edit.scrollPositionDown = true;
        return;
      }
    }

    this.edit.scrollPositionDown = false;
    if (this.edit.widgetField.scrollTop === 0) {
      this.edit.scrollMoveDown = false;
      const sizeWidget = this.edit.widgetField.scrollHeight;
      const result = this.generator.next();
      if (result.value) {
        result.value.reverse();
        for (let i = 0; i < result.value.length; i += 1) {
          this.edit.drawMessage({ ...result.value[i], append: false });
          this.edit.widgetField.scrollTop = this.edit.widgetField.scrollHeight - sizeWidget;
        }
      } else {
        this.edit.scrollMoveDown = true;
      }
    }
  }

  request({ path, method = 'GET', body = null } = {}) {
    // Метод для осуществления fetch запросов на сервер
    return new Promise((resolve) => {
      const result = fetch(`${this.url}/${path}`, {
        method,
        body,
      });
      resolve(result);
    });
  }

  async onClickFavorites() {
    // Callback - отображения списка избранных сообщений (кнопка избранное)
    const div = this.edit.getDivFavorites();
    this.edit.scrollPositionDown = true;
    let result = null;
    if (!this.edit.statusFavorites) {
      this.edit.statusFavorites = true;
      div.classList.add('favorites__active');
      div.firstElementChild.textContent = 'Отменить избранное';
      result = await this.request({ path: 'favorites' });
    } else {
      this.edit.resetFavorites();
      result = await this.request({ path: 'all' });
    }
    const json = await result.json();
    this.stap = 0;
    // console.log('json', json);

    // генератор для ленивой подгрузки:
    this.allMessage = json.slice();
    this.generator = this.generatorMessages(10); // для подгрузки избранных сообщений
    const { value } = this.generator.next();

    const field = this.edit.getWidgetField();
    const array = [...field.children];
    array.forEach((element) => element.remove());
    for (let i = 0; i < value.length; i += 1) {
      // console.log(value[i]);
      this.edit.drawMessage(value[i]);
    }
  }

  async onClickFiles() {
    // Callback - для события click на кнопку файлы
    const btnFiles = this.edit.container.querySelector('.controll__files');
    const field = this.edit.getFieldFiles();
    this.clearFiles();
    if (field.className.includes('hidden')) {
      field.classList.remove('hidden');
      this.countFiles();
      btnFiles.classList.add('controll__files__active');
      btnFiles.firstElementChild.textContent = 'Закрыть файлы';
    } else {
      field.classList.add('hidden');
      btnFiles.classList.remove('controll__files__active');
      btnFiles.firstElementChild.textContent = 'Файлы';
    }
  }

  async countFiles() {
    // Подсчитывает количество файлов для поля файлы
    const result = await this.request({ path: 'all' });
    const array = await result.json();
    for (let i = 0; i < array.length; i += 1) {
      const { type } = array[i];
      if (type === 'message') {
        const count = countLinks(array[i].content);
        if (count > 0) {
          this.replaceCount('links', count);
          this.replaceCount('all', count);
        }
      } else {
        this.replaceCount(type, 1);
        this.replaceCount('all', 1);
      }
    }
  }

  clearFiles() {
    // Очищает поле файлов
    const array = ['all', 'video', 'audio', 'image', 'files', 'links'];
    for (const type of array) {
      this.replaceCount(type, false);
    }
  }

  replaceCount(type, number) {
    // Замена нового значения для поля счетчика файлов
    const div = this.edit.getTypeFiles(type);
    if (!div) {
      return;
    }
    const arrString = div.textContent.split(': ');
    if (number !== false) {
      arrString[1] = Number(arrString[1]) + number;
    } else {
      arrString[1] = 0;
    }
    div.textContent = arrString.join(': ');
  }

  onClickMenu() {
    // Callback - нажатия на кнопку меню
    const menu = this.edit.container.querySelector('.widget__menu');
    const field = this.edit.container.querySelector('.widget__field');
    const btnMenu = this.edit.container.querySelector('.controll__menu');
    if (menu.className.includes('widget__menu__active')) {
      menu.classList.remove('widget__menu__active');
      field.classList.remove('widget__field__mini');
      btnMenu.classList.remove('controll__menu__active');
      this.clearFiles();
      const files = this.edit.container.querySelector('.field__fiels');
      files.classList.add('hidden');
      const btnFiles = this.edit.container.querySelector('.controll__files');
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

  onPressEmoji(event) {
    // Callback - нажатия кнопки smile
    const { target } = event;
    if (target.className.includes('footer__smiles')) {
      const smiles = target.querySelector('.box__smiles__conteiner');
      if (!smiles) {
        target.classList.add('footer__smiles__active');
        const conteiner = this.edit.constructor.addTagHTML(target, { className: 'box__smiles__conteiner' });
        const box = this.edit.constructor.addTagHTML(conteiner, { className: 'box__smiles' });

        SMILES.forEach((item) => {
          const divElement = this.edit.constructor.addTagHTML(box, { className: 'smile__item' });
          divElement.textContent = item;
        });

        conteiner.addEventListener('click', (o) => {
          if (o.target.className.includes('smile__item')) {
            this.edit.input.value += o.target.textContent;
            this.edit.input.focus();
          }
        });
      } else {
        target.classList.remove('footer__smiles__active');
        smiles.remove();
      }
    }
  }
}

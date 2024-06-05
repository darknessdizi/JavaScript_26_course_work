import GeolocationModal from '../editor/modal/GeolocationModal/GeolocationModal';
import RecordVideoModal from '../editor/modal/RecordVideoModal';
import { checkCoords, getStringCoords, getCoords } from '../utils/coords';

export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
    this.buffer = {};
    this.generator = null;

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

    const parent = this.edit.container.querySelector('.widget');
    this.modals['geoModal'].drawModal(parent);
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
      ws.close();
    });

    this.ws.addEventListener('message', async (e) => {
      console.log('*** WS *** новое *** message ***');
      // получение данных от сервера через WebSocket:
      const obj = await JSON.parse(e.data);
      const field = this.edit.getWidgetField();

      if (obj.status === 'connection') {
        // если первое подключение, то отрисовать все
        console.log('Новое подключение к серверу');

        this.generator = this.generatorMessages(obj.result.slice(), 10);
        const result =  this.generator.next().value;
        for (let i = 0; i < result.length; i += 1) {
          const item = this.edit.findID(result[i].id);
          if (!item) {
            result[i].url = this.url;
            this.edit.drawMessage(result[i]);
          }
        }
        return;
      }

      if (obj.status === 'changeFavorite') {
        this.edit.changeFavorite(obj.result);
        return;
      }

      if (obj.status === 'deleteMessage') {
        this.edit.deleteMessage(obj.result);
        return;
      }

      for (let i = 0; i < obj.length; i += 1) {
        console.log('add file');
        obj[i].url = this.url;
        this.edit.drawMessage(obj[i]);
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

    await fetch(`${this.url}/message`, {
      method: 'POST',
      body: formData,
    });
  }

  async requestAddMessage(stringCords, modal) {
    const formData = new FormData();
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    formData.append('content', this.edit.input.value);

    await fetch(`${this.url}/message`, {
      method: 'POST',
      body: formData,
    });
    modal.hide();
    this.edit.input.value = '';
  }

  async submitGeoModal(event) {
    // Callback - нажатие кнопки ОК в модальном окне Geolocation
    const modal = this.getModal('geoModal');
    const input = modal.input;
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
        await fetch(`${this.url}/upload`, {
          method: 'POST',
          body: formData,
        });
      }
      modal.hide();
      this.buffer = {};
      return;
    }
    if (this.buffer.formData) {
      this.buffer.formData.append('cords', stringCords);
      await fetch(`${this.url}/upload`, {
        method: 'POST',
        body: this.buffer.formData,
      });
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
      buffer: this.buffer,
    }

    const modal = this.getModal('recordModal');
    modal.show();
    modal.recordMedia(options, connection);
  }

  submitRecordModal() {
    // Callback - нажатие кнопки OK (сохранение аудио/видео записи)
    const modal = this.getModal('recordModal');
    modal.save = true;
    modal.urlServer = this.url;
    modal.recorder.stop(); // остановка записи видеопотока
    this.edit.input.value = '';
  }

  onChangeInput(event) {
    // В поле input выбрали фото и нажали открыть
    console.log('event', event.target);
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

    await fetch(`${this.url}/upload`, {
      method: 'POST',
      body: formData,
    });
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

      await fetch(`${this.url}/upload`, {
        method: 'POST',
        body: formData,
      });
    }
  }

  async onClickWidget(event) {
    // Callback - нажатие мышкой в поле виджета (поле отображения файлов)
    const { target } = event;
    if (target.className.includes('message__controll__star')) {
      const status = !target.className.includes('active');
      const parent = target.closest('.widget__field__message');
      await fetch(`${this.url}/favorite/${parent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ favorite: status }),
      });
      return;
    }
    if (target.className.includes('message__controll__delete')) {
      const parent = target.closest('.widget__field__message');
      await fetch(`${this.url}/delete/${parent.id}`, {
        method: 'DELETE',
      });
      return;
    }
  }

  *generatorMessages(array, number) {
    // Генератор выдачи списка сообщений в количестве равном number
    let count = 0;
    let result = [];
    if (array.length === 0) {
      return result;
    }
    array.reverse();
    for (let i = 0; i < array.length; i += 1) {
      count += 1;
      result.push(array[i]);
      if (count === number) {
        yield result.reverse();
        result = [];
        count = 0;
      }
    }
    return result.reverse();
  }

  onScrollWidget(event) {
    // Метод определяет движение/удержание скрола при загрузке файлов

    // Складываем высоту от верхнего края виджета 
    // до видимой части с высотой видимой части.
    // Это высота до нижнего край нашей позиции у виджета
    const scrollHeight = this.edit.widgetField.scrollTop + event.target.clientHeight;
    if (this.edit.scrollMoveDown) {
      if (
        (scrollHeight + 1 >= this.edit.widgetField.scrollHeight) ||
        (this.edit.scrollArrayLoad.length > 0)
      ) {
        this.edit.scrollPositionDown = true;
        return;
      }
    }

    this.edit.scrollPositionDown = false;
    if (this.edit.widgetField.scrollTop === 0) {
      this.edit.scrollMoveDown = false;
      const sizeWidget = this.edit.widgetField.scrollHeight;
      const result =  this.generator.next();
      if (result.value) {
        result.value.reverse();
        for (let i = 0; i < result.value.length; i += 1) {
          result.value[i].url = this.url;
          this.edit.drawMessage({ ...result.value[i], append: false });
          this.edit.widgetField.scrollTop = this.edit.widgetField.scrollHeight - sizeWidget;
        }
      } else {
        this.edit.scrollMoveDown = true;
      }
    }
  }
}

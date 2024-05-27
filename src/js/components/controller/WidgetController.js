export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
    this.ws = new WebSocket(url.replace(/^http/, 'ws')); // создаем WebSocket по адресу 'ws://localhost:9000/'
  }

  init() {
    this.edit.drawWidget();
    this.edit.addInputListeners(this.onPressInput.bind(this));
    this.addListenersWS();
  }

  addListenersWS(type = 'ws open') {
    // Подключение событий для объекта WebSocket
    this.ws.addEventListener('open', (e) => console.log(type));
    this.ws.addEventListener('close', (e) => {
      console.log('ws close');
      setTimeout(() => {
        this.connectWS();
      }, 5000);
    });
    this.ws.addEventListener('error', (e) => {
      console.log('ws error');
      ws.close();
    });

    this.ws.addEventListener('message', (e) => {
      console.log('*************', e.data);
      const obj = JSON.parse(e.data); // получение данных от сервера через WebSocket
      if (obj.status === 'connection') {
        for (let i = 0; i < obj.result.length; i += 1) {
          this.edit.drawMessage(obj.result[i]);
        }
      }
      if (obj.status === 'addMessage') {
        this.edit.drawMessage(obj.result);
      }
    });
  }

  connectWS() {
    // Востановление соединения при сбое
    this.ws = new WebSocket(this.url.replace(/^http/, 'ws'));
    this.addListenersWS('Востановлено соединение');
  }

  async onPressInput() {
    // Callback - нажатие кнопки enter в поле ввода сообщения
    const cords = await WidgetController.getCoords(); // получение координат
    if (!cords) {
      // this.edit.drawPopup(); // если координат нет, то отрисовать окно
      console.log('Отрисовать попап');
      return;
    }
    const stringCords = WidgetController.getStringCoords(cords, 5);
    const form = this.edit.container.querySelector('.footer__form');
    const formData = new FormData(form);
    formData.append('cords', stringCords);
    formData.append('type', 'message');
    this.edit.input.value = '';

    const response = await fetch(this.url, {
      method: 'POST',
      body: formData,
    });

    // const json = await response.json();
    // this.edit.drawMessage(json);
  }

  static getCoords() {
    // Запрос на получение координат
    return new Promise((resolve) => {
      if (navigator.geolocation) { // проверка на поддержку геолокации браузером
        navigator.geolocation.getCurrentPosition(
          (data) => { // callback - на успешное получение координат
            console.log('data', data);
            resolve({ // вернет объект с координатами
              latitude: data.coords.latitude,
              longitude: data.coords.longitude,
            });
          },
          (error) => { // callback - ошибка при получении координат
            console.log('Ошибка получения координат', error);
            resolve(false);
          },
          {
            timeout: 3000, // ограничили время ответа на запрос координат
          },
        );
      } else {
        resolve(false);
      }
    });
  }

  static getStringCoords(cords, number) {
    // Получение строки с координатами
    // number - ограничение на max-количество чисел после запятой
    const listLatitude = String(cords.latitude).split('.');
    let latitude = null;
    if (listLatitude.length > 1) {
      // получение широты
      if (listLatitude[1].length < number) {
        latitude = cords.latitude.toFixed(listLatitude[1].length);
      } else {
        latitude = cords.latitude.toFixed(number);
      }
    } else {
      latitude = cords.latitude;
    }

    const listLongitude = String(cords.longitude).split('.');
    let longitude = null;
    if (listLongitude.length > 1) {
      // получение долготы
      if (listLongitude[1].length < number) {
        longitude = cords.longitude.toFixed(listLongitude[1].length);
      } else {
        longitude = cords.longitude.toFixed(number);
      }
    } else {
      longitude = cords.longitude;
    }
    return `${latitude}, ${longitude}`;
  }
  
}

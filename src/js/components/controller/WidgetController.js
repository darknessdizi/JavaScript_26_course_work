export default class WidgetController {
  constructor(edit, url) {
    this.edit = edit;
    this.url = url;
  }

  init() {
    this.edit.drawWidget();

    this.edit.addInputListeners(this.onPressInput.bind(this));
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

    const json = await response.json();
    this.edit.drawMessage(json);
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


//   onLinkClick() {
//     // Callback - нажатие на ссылку обновить
//     this.getRequest();
//   }

//   async getRequest() {
//     // Сетевой запрос на сервер по URl /articles
//     const response = await fetch(`${this.url}/articles`);
//     if (response.status === 200) {
//       const json = await response.json();
//       if (json.status === 'ok') {
//         const array = Array.from(this.edit.articles.children);
//         array.forEach((item) => {
//           item.remove();
//         });
//         json.articles.forEach((item) => {
//           this.edit.drawArcticle(item);
//         });
//       } else {
//         this.edit.drawPopup();
//       }
//     } else {
//       this.edit.drawPopup();
//     }
//   }


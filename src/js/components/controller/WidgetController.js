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
    this.edit.drawMessage();
    // const cords = await TimelineController.getCoords(); // получение координат
    // if (!cords) {
    //   this.edit.drawPopup(); // если координат нет, то отрисовать окно
    //   return;
    // }
    // const data = TimelineController.getStringCoords(cords, 5);
    // this.edit.drawMessage(data);
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

//   static listenServiceWorker() {
//     // Регистрация сервис воркера
//     if ('serviceWorker' in navigator) {
//       navigator.serviceWorker.register('./service-worker.js', { scope: './' })
//         .then((reg) => {
//           console.log(`Registration succeeded. Scope is ${reg.scope}`);
//         }).catch((error) => {
//           console.log(`Registration failed with ${error}`);
//         });
//     }
//   }
// }

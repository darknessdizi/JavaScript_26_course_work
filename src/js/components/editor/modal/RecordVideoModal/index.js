import BaseModal from '../../../base/BaseModal';
import recModalHtml from './recordVideoModal.html'

export default class RecordVideoModal extends BaseModal {
  constructor() {
    super('recordModal');
    this.submitListeners = [];
    // this.input = null;

    this.init();
  }

  init() {
    // Инициализация и сохранение модального окна
    const div = document.createElement('div');
    div.setAttribute('class', 'background-popup');
    div.dataset.type = 'background-recordModal';
    // div.classList.add('hidden');
    div.insertAdjacentHTML('afterbegin', recModalHtml);
    this.bindToDOM(div);
  }

  drawModal(parent) {
    // Отрисовка модального окна
    parent.append(this.container);
    // this.input = this.container.querySelector('.popup-input');

    // const cancel = this.container.querySelector('.control-cancel');
    // const btnOk = this.container.querySelector('.control-ok');

    // cancel.addEventListener('click', () => this.hide());
    // btnOk.addEventListener('click', (o) => this.onSubmit(o));
    // this.input.addEventListener('input', () => this.input.setCustomValidity(''));
  }

  // onSubmit(event) {
  //   // Вызывает callback при событии submit модального окна
  //   // event.preventDefault(); // необходимо отключить, чтобы использовать подсказки браузера
  //   this.submitListeners.forEach((o) => o.call(null, event));
  // }

  // addGeoModalListeners(callback) {
  //   // Сохраняет callback для события submit
  //   this.submitListeners.push(callback);
  // }
}
import BaseModal from '../../../base/BaseModal';
import geoModalHtml from './geolocationModal.html'

export default class GeolocationModal extends BaseModal {
  constructor() {
    super('geoModal');
    this.submitListeners = [];
    this.input = null;

    this.init();
  }

  init() {
    // Инициализация и сохранение модального окна
    const div = document.createElement('div');
    div.setAttribute('class', 'background__popup');
    div.dataset.type = 'background__geoModal';
    div.classList.add('hidden');
    div.insertAdjacentHTML('afterbegin', geoModalHtml);
    this.bindToDOM(div);
  }

  drawModal(parent) {
    // Отрисовка модального окна
    parent.append(this.container);
    this.input = this.container.querySelector('.popup__input');

    const cancel = this.container.querySelector('.btn__cancel');
    const btnOk = this.container.querySelector('.btn__ok');

    cancel.addEventListener('click', () => this.hide());
    btnOk.addEventListener('click', (o) => this.onSubmit(o));
    this.input.addEventListener('input', () => this.input.setCustomValidity(''));
  }

  onSubmit(event) {
    // Вызывает callback при событии submit модального окна
    // event.preventDefault(); // необходимо отключить, чтобы использовать подсказки браузера
    this.submitListeners.forEach((o) => o.call(null, event));
  }

  addGeoModalListeners(callback) {
    // Сохраняет callback для события submit
    this.submitListeners.push(callback);
  }
}
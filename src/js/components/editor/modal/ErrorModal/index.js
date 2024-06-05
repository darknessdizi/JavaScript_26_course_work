import BaseModal from '../../../base/BaseModal';
import errorModalHtml from './errorModal.html';

export default class ErrorModal extends BaseModal {
  constructor() {
    super('errorModal');
    this.box = null;

    this.init();
  }

  init() {
    // Инициализация и сохранение модального окна
    const div = document.createElement('div');
    div.setAttribute('class', 'background-popup');
    div.dataset.type = 'background-errorModal';
    div.classList.add('hidden');
    div.insertAdjacentHTML('afterbegin', errorModalHtml);
    this.bindToDOM(div);
  }

  drawModal(parent) {
    // Отрисовка модального окна
    parent.append(this.container);

    const btnOk = this.container.querySelector('.error__btn__ok');
    btnOk.addEventListener('click', () => this.clearModal());
  }

  getSelector(text) {
    // Возвращает элемент по селектору
    return this.container.querySelector(text);
  }

  showError(type) {
    // Показывает тип ошибки
    this.box = this.container.querySelector(`.content__error__${type}`);
    this.box.classList.remove('hidden');
  }

  clearModal() {
    // Возврат модального окна в исходное состояние
    this.box.classList.add('hidden');
    this.hide();
    this.box = null;
  }
}

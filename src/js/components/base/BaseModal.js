/*
  Базовый класс для отрисовки модальный окон в DOM объектах.
  Предназначен для наследования и использования в разных проектах
*/

export default class Modal {
  constructor(typeModal) {
    this.container = null;
    this.typeModal = typeModal;

    if (new.target === Modal.prototype.constructor) {
      throw new Error('Нельзя использовать вызов new Modal()');
    }
  }

  bindToDOM(container) {
    // Проверяет контейнер на принадлежность к DOM и сохраняет его
    if (!(container instanceof HTMLElement)) {
      throw new Error('Container is not HTMLElement');
    }

    this.container = container;
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
    this.getForm().reset();
  }

  getForm() {
    return document.querySelector(`form[data-type=${this.typeModal}]`);
  }
}

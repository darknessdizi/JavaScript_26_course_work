/*
  Базовый класс для отрисовки DOM объектов.
  Предназначен для наследования и использования в разных проектах
*/

export default class BaseWindowEditor {
  constructor() {
    this.container = null;

    if (new.target === BaseWindowEditor.prototype.constructor) {
      throw new Error('Нельзя использовать вызов new BaseWindowEditor()');
    }
  }

  bindToDOM(container) {
    // Проверяет контейнер на принадлежность к DOM и сохраняет его
    if (!(container instanceof HTMLElement)) {
      throw new Error('Container is not HTMLElement');
    }

    this.container = container;
  }

  static addTagHTML(parent, { className = 'null', type = 'div', append = true } = {}) {
    // Создает заданный тег и добавляет его в parent
    if (!(parent instanceof HTMLElement)) {
      throw new Error('Assign object is not HTMLElement');
    }

    const htmlElement = document.createElement(type);

    if (className !== 'null') {
      htmlElement.classList.add(className);
    }

    if (append) {
      parent.append(htmlElement);
    } else {
      parent.prepend(htmlElement);
    }

    return htmlElement;
  }
}

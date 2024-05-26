import WidgetEditor from './components/editor/WidgetEditor';
import WidgetController from './components/controller/WidgetController';

export default class Widget {
  constructor(conteiner, url) {
    this.edit = new WidgetEditor(conteiner);
    this.controller = new WidgetController(this.edit, url);
  }

  init() {
    this.controller.init();
  }
}

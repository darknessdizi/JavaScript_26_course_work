import GeoAddModal from './models/forms/geoAddModal';
import EditModal from './models/forms/editModal';
import DeleteModal from './models/forms/deleteModal';
import WSEvents from './requests/wsEvents';
import MediaStream from './models/media/mediaStream';
import ErrorModal from './models/forms/errorModal';
import RecordModal from './models/forms/recordModal';
import { getTaskById, getPinnedType } from './functions/functions';
import eventsInput from './events/eventsInput';
import eventsClickModal from './events/eventsClickModal';
import eventsDragAndDrop from './events/eventsDragAndDrop';
import eventsScroll from './events/eventsScroll';
import eventsClick from './events/eventsClick';

export default class AppController {
  constructor(url) {
    this.url = url;
    this.container = document.querySelector('.container_organizer');
    this.currentTask = null;
    this.blocked = null;
    this.buffer = {
      stateTask: { attached: null, timeLastStamp: null },
      tasksList: [],
      taskView: [],
    };
  }

  init() {
    this.getForms();
    this.getDOMElements();
    this.initWS();
    this.initEnents();
    this.initMediaFunction();
  }

  getDOMElements() {
    this.inputEl = document.querySelector('.textarea_task');
    this.textareaTask = document.querySelector('.textarea_task');
    this.footerSticks = document.querySelectorAll('footer .icon');
    this.tasksBoxEl = document.querySelector('.main-container_content');
    this.forms = document.querySelectorAll('.form-modal');
    this.uploadEl = document.querySelector('.upload_input');
    this.dragableEl = document.querySelector('.draggable_area');
    this.ctrlAsideEl = document.querySelector('.info_aside');
    this.pinnedMessage = document.querySelector('.pinned_message');
  }

  getForms() {
    this.modals = {
      geoModal: new GeoAddModal(),
      editModal: new EditModal(),
      delModal: new DeleteModal(),
      errModal: new ErrorModal(),
      recordModal: new RecordModal(),
    };
  }

  initWS() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'blob';
    this.registerSocketEvents();
  }

  initMediaFunction() {
    this.mediaRecorder = new MediaStream(this);
  }

  initEnents() {
    document.addEventListener('click', (e) => {
      eventsClick.call(this, e);
    });

    document.addEventListener('dragover', (e) => {
      eventsDragAndDrop.call(this, e);
    });

    document.addEventListener('dragleave', (e) => {
      eventsDragAndDrop.call(this, e);
    });

    this.dragableEl.addEventListener('drop', (e) => {
      eventsDragAndDrop.call(this, e);
    });

    this.uploadEl.addEventListener('change', (e) => {
      eventsInput.call(this, e);
    });

    this.forms.forEach((form) => {
      form.addEventListener('click', (e) => {
        eventsClickModal.call(this, e);
      });
    });

    this.tasksBoxEl.addEventListener('scroll', () => {
      eventsScroll.call(this);
    });

    this.inputEl.addEventListener('input', (e) => {
      eventsInput.call(this, e);
    });

    this.inputEl.addEventListener('keydown', (e) => {
      eventsInput.call(this, e);
    });
  }

  showPinnedMessage(id) {
    const pinnedTask = getTaskById(this.buffer, id);
    const pinnedElement = document.querySelector(`[data-id="${id}"]`);
    pinnedTask.isPinned = true;
    this.pinnedMessage.classList.remove('hidden');
    this.pinnedMessage.style.top = `${this.tasksBoxEl.scrollTop}px`;
    pinnedElement.classList.add('is-pinned', 'hidden');

    this.pinnedMessage.querySelector('.pinned_info_box_type')
      .textContent = getPinnedType(pinnedTask);

    this.buffer.stateTask.attached = id;
    this.taskUnderAction = null;
  }

  hidePinnedMessage() {
    this.pinnedMessage.classList.add('hidden');
    this.buffer.stateTask.attached = null;
  }

  taskViewClose() {
    this.ctrlAsideEl.lastElementChild.innerHTML = '';
    this.ctrlAsideEl.classList.add('hidden');
    this.buffer.taskView = [];
  }

  showPinnedTask() {
    const pinnedId = this.buffer.stateTask.attached;
    const pinnedTaskIdx = this.buffer.tasksList.findIndex((task) => task.id === pinnedId);
    const lastIndex = this.buffer.tasksList.length - 1;
    const pinnedElement = document.querySelector('.is-pinned');
    const pinnedTask = this.buffer.tasksList.find(({ isPinned }) => isPinned);

    if (pinnedTaskIdx < lastIndex) {
      const nextTaskId = this.buffer.tasksList[pinnedTaskIdx + 1].id;
      const nextElement = document.querySelector(`[data-id="${nextTaskId}"]`);
      nextElement.insertAdjacentElement('beforebegin', pinnedElement);
    } else if (!lastIndex) {
      this.tasksBoxEl.insertAdjacentElement('beforebegin', pinnedElement);
    } else {
      const prevTaskId = this.buffer.tasksList[pinnedTaskIdx - 1].id;
      const prevElement = document.querySelector(`[data-id="${prevTaskId}"]`);
      prevElement.insertAdjacentElement('afterend', pinnedElement);
    }

    pinnedElement.classList.remove('hidden', 'is-pinned');
    pinnedElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
    pinnedTask.switchPinned();
  }

  registerSocketEvents() {
    const handlers = new WSEvents(this);
    this.ws.onopen = () => handlers.onWSOpen(this);
    this.ws.onclose = () => handlers.onWSClose(this);
    this.ws.onmessage = (e) => handlers.onWSMessage(this, e);
  }

  getModal(modalName) {
    return this.modals[modalName];
  }
}

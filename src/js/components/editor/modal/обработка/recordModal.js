import Modal from './modal';

export default class RecordModal extends Modal {
  constructor(type = 'recordModal') {
    super(type);
    this.errorBox = document.querySelector('.error-box');
  }

  createMarkup() {
    return `
      <div class="modal modal-wrapper hidden"  data-type="recordModal">
        <form class="form-modal record-form-modal" data-type="recordModal" novalidate>
          <div class="form-title">Запись медиа-контента</div>
          <p class="message-content">
            записываю...
          </p>
          <div class="preview_video_box">
            <video class="video_box hidden" muted></video> 
          </div>          
          <div class="modal-btn-row modal-row">
            <button class="modal-btn record-btn save-record-btn">OK</button>
            <span class="timer">00:00</span>
            <button class="modal-btn record-btn cancel-record-btn">Отмена</button>            
          </div>      
        </form>
      </div>
    `;
  }
}

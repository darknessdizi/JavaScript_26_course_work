import Modal from './modal';

export default class ErrorModal extends Modal {
  constructor(type = 'errModal') {
    super(type);
    this.errorBox = document.querySelector('.error-box');
  }

  createMarkup() {
    return `
      <div class="modal modal-wrapper hidden"  data-type="errModal">
        <form class="form-modal err-form-modal" data-type="errModal" novalidate>
          <div class="form-title">Ошибочка вышла!</div>
          <p class="message-content">
            
          </p>       
          
          <div class="modal-btn-row modal-row">
            <button class="modal-btn cancel-btn">Ok</button>           
          </div>      
        </form>
      </div>
    `;
  }

  setMessage(message) {
    this.getForm().querySelector('.message-content').textContent = message;
  }
}

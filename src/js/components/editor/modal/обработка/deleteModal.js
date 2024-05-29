import Modal from './modal';

export default class DeleteModal extends Modal {
  constructor(type = 'delModal') {
    super(type);
  }

  createMarkup() {
    return `
      <div class="modal modal-wrapper hidden"  data-type="delModal">
        <form class="form-modal del-form-modal" data-type="delModal" novalidate>
          <div class="form-title">Удаление записи</div>
          <p class="message-content">
            Вы действительно хотите удалить данную запись?
            Это действие необратимо!
          </p>
          
          <div class="modal-btn-row modal-row">
            <button class="modal-btn ok-btn">Удалить</button>
            <button class="modal-btn cancel-btn">Отмена</button>            
          </div>    
        </form>
      </div>
    `;
  }
}

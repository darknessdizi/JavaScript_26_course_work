import Widget from './Widget';

const url = 'http://localhost:9000';
const container = document.querySelector('.container');

const widget = new Widget(container, url);
widget.init();

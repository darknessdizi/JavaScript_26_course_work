import Widget from './Widget';

// const url = 'http://localhost:9000';
const url = 'https://javascript-26-coursework-backend.onrender.com';
const container = document.querySelector('.container');

const widget = new Widget(container, url);
widget.init();

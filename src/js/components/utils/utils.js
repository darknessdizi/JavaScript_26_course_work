export function convertTextToLinks(text) {
  // Поиск и замена текста содержащего http/https на ссылку 
  const urlPattern = /\bhttps?:\/\/\S+/gi;
  return text.replace(urlPattern, function (url) {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });
}

export function getNewFormatDate(timestamp) {
  // Возвращает новый формат даты и времени
  const start = new Date(timestamp);
  const year = String(start.getFullYear());
  const month = _addZero(start.getMonth() + 1);
  const date = _addZero(start.getDate());
  const hours = _addZero(start.getHours());
  const minutes = _addZero(start.getMinutes());
  const time = `${hours}:${minutes} ${date}.${month}.${year}`;
  return time;
}

function _addZero(number) {
  // делает число двухзначным
  let result = number;
  if (result < 10) {
    result = `0${result}`;
  }
  return result;
}

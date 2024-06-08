function _addZero(number) {
  // делает число двухзначным
  let result = number;
  if (result < 10) {
    result = `0${result}`;
  }
  return result;
}

export function convertTextToLinks(text) {
  // Поиск и замена текста содержащего http/https на ссылку
  const urlPattern = /\bhttps?:\/\/\S+/gi;
  return text.replace(urlPattern, (url) => `<a href="${url}" target="_blank">${url}</a>`);
}

export function countLinks(str) {
  // Поиск в тексте ссылок и возврат их количества
  const regexp = /\bhttps?:\/\/\S+/gi;
  const matchAll = str.match(regexp);
  if (matchAll === null) {
    return null;
  }
  return matchAll.length;
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

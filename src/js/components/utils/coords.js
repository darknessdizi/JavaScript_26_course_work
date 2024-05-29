export function checkCoords(input) {
  // Проверка ввода данных координат пользователем
  // На вход получает поле input (DOM-элемент)
  const regexp2 = /^[-+]?\d{1,2}(?:\.\d+)?,\s*[-+]?\d{1,3}(?:\.\d+)?$/;
  const regexp = /^\[[-+]?\d{1,2}(?:\.\d+)?,\s*[-+]?\d{1,3}(?:\.\d+)?\]$/;
  const { value } = input;
  if (regexp.test(value)) {
    const [latitude, longitude] = value.split(',');
    const cords = {
      latitude: Number(latitude.replace('[', '').trim()),
      longitude: Number(longitude.replace(']', '').trim()),
    };
    return cords;
  }
  if (regexp2.test(value)) {
    const [latitude, longitude] = value.split(',');
    const cords = {
      latitude: Number(latitude.trim()),
      longitude: Number(longitude.trim()),
    };
    return cords;
  }
  // Делаем поле input не валидным
  input.setCustomValidity('Не верно указаны координаты');
  return false;
}

export function getStringCoords(cords, number) {
  // Получение строки с координатами
  // number - ограничение на max-количество чисел после запятой
  // cords - объект содержащий координаты
  const listLatitude = String(cords.latitude).split('.');
  let latitude = null;
  if (listLatitude.length > 1) {
    // получение широты
    if (listLatitude[1].length < number) {
      latitude = cords.latitude.toFixed(listLatitude[1].length);
    } else {
      latitude = cords.latitude.toFixed(number);
    }
  } else {
    latitude = cords.latitude;
  }

  const listLongitude = String(cords.longitude).split('.');
  let longitude = null;
  if (listLongitude.length > 1) {
    // получение долготы
    if (listLongitude[1].length < number) {
      longitude = cords.longitude.toFixed(listLongitude[1].length);
    } else {
      longitude = cords.longitude.toFixed(number);
    }
  } else {
    longitude = cords.longitude;
  }
  return `${latitude}, ${longitude}`;
}

export function getCoords() {
  // Запрос на получение координат в браузере
  return new Promise((resolve) => {
    if (navigator.geolocation) { // проверка на поддержку геолокации браузером
      navigator.geolocation.getCurrentPosition(
        (data) => { // callback - на успешное получение координат
          console.log('data', data);
          resolve({ // вернет объект с координатами
            latitude: data.coords.latitude,
            longitude: data.coords.longitude,
          });
        },
        (error) => { // callback - ошибка при получении координат
          console.log('Ошибка получения координат', error);
          resolve(false);
        },
        {
          timeout: 3000, // ограничили время ответа на запрос координат
        },
      );
    } else {
      resolve(false);
    }
  });
}

const fetch = require("node-fetch");
const s_city = "Ivanovo,RU";
const appid = "3917cad1c75ea2396a1a04bad266433c";

async function getWeather() {
  try {
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${s_city}&units=metric&lang=ru&APPID=${appid}`
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data) {
      let weatherInfo = `Погода в ${data.name}:\n`;
      weatherInfo += `Описание: ${data.weather[0].description}\n`;
      weatherInfo += `Температура: ${data.main.temp} °C\n`;
      weatherInfo += `Скорость ветра: ${data.wind.speed} м/с`;
      return weatherInfo;
    } else {
      throw new Error("Не удалось получить данные о погоде.");
    }
  } catch (error) {
    throw new Error(`Ошибка при получении данных о погоде: ${error.message}`);
  }
}

module.exports = getWeather;

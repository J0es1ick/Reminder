const fetch = require("node-fetch");

async function getWeather(text) {
  const s_city = text;
  const appid = "3917cad1c75ea2396a1a04bad266433c";
  try {
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${s_city}&units=metric&lang=ru&APPID=${appid}`
    );

    if (!response.ok) {
      console.log(`Ошибка HTTP: ${response.status}`);
      return undefined;
    }

    const data = await response.json();

    if (data) {
      let weatherInfo = `Погода в ${data.name}:\n`;
      weatherInfo += `Описание: ${data.weather[0].description}\n`;
      weatherInfo += `Температура: ${data.main.temp} °C\n`;
      weatherInfo += `Скорость ветра: ${data.wind.speed} м/с`;
      return weatherInfo;
    } else {
      console.log("Не удалось получить данные о погоде.");
      return undefined;
    }
  } catch (error) {
    console.log(`Ошибка при получении данных о погоде: ${error.message}`);
    return undefined;
  }
}

module.exports = getWeather;

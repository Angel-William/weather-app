const apiKey = "ed0c4d90ba175acf453a715a4bd93b1b";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const body = document.body;

// Cool new features
let currentCity = "";
let weatherHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

// Add geolocation functionality
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
      },
      (error) => {
        console.log("Geolocation error:", error);
        showNotification("Location access denied. Please search manually.", "error");
      }
    );
  } else {
    showNotification("Geolocation not supported by this browser.", "error");
  }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  const coordUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(coordUrl);
  const data = await response.json();
  displayWeather(data);
}

// Enhanced weather check function
async function checkWeather(city) {
  try {
    showLoading(true);
    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
    
    if(response.status == 404){
      document.querySelector(".error").style.display = "block";
      document.querySelector(".weather").style.display = "none";
      showNotification("City not found! Please try again.", "error");
      return;
    }
    
    const data = await response.json();
    displayWeather(data);
    
    // Get 5-day forecast
    getForecast(city);
    
    // Save to history
    saveToHistory(data);
    
    // Update background based on weather
    updateBackground(data.weather[0].main);
    
  } catch (error) {
    console.error("Error fetching weather:", error);
    showNotification("Failed to fetch weather data", "error");
  } finally {
    showLoading(false);
  }
}

// Display weather with animations
function displayWeather(data) {
  currentCity = data.name;
  
  // Add fade-in animation
  const weatherCard = document.querySelector(".weather");
  weatherCard.style.opacity = "0";
  weatherCard.style.display = "block";
  
  document.querySelector(".city").innerHTML = data.name;
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
  
  // Add feels like temperature
  if (document.querySelector(".feels-like")) {
    document.querySelector(".feels-like").innerHTML = "Feels like " + Math.round(data.main.feels_like) + "°C";
  }
  
  // Add pressure and visibility
  if (document.querySelector(".pressure")) {
    document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";
  }
  
  // Update weather icon with animation
  updateWeatherIcon(data.weather[0].main);
  
  // Fade in animation
  setTimeout(() => {
    weatherCard.style.transition = "opacity 0.5s ease-in";
    weatherCard.style.opacity = "1";
  }, 100);
  
  document.querySelector(".error").style.display = "none";
}

// Enhanced weather icon function
function updateWeatherIcon(weatherMain) {
  const iconMap = {
    "Clouds": "images/clouds.png",
    "Clear": "images/clear.png",
    "Rain": "images/rain.png",
    "Drizzle": "images/drizzle.png",
    "Mist": "images/mist.png",
    "Snow": "images/snow.png",
    "Thunderstorm": "images/storm.png",
    "Fog": "images/mist.png",
    "Haze": "images/mist.png"
  };
  
  weatherIcon.src = iconMap[weatherMain] || "images/clear.png";
  
  // Add bounce animation
  weatherIcon.style.animation = "bounce 0.6s ease-in-out";
  setTimeout(() => {
    weatherIcon.style.animation = "";
  }, 600);
}

// Dynamic background based on weather
function updateBackground(weatherMain) {
  const backgroundMap = {
    "Clear": "linear-gradient(135deg, #74b9ff, #0984e3)",
    "Clouds": "linear-gradient(135deg, #636e72, #2d3436)",
    "Rain": "linear-gradient(135deg, #74b9ff, #0984e3)",
    "Drizzle": "linear-gradient(135deg, #81ecec, #00b894)",
    "Thunderstorm": "linear-gradient(135deg, #2d3436, #636e72)",
    "Snow": "linear-gradient(135deg, #ddd, #74b9ff)",
    "Mist": "linear-gradient(135deg, #636e72, #b2bec3)",
    "Fog": "linear-gradient(135deg, #636e72, #b2bec3)"
  };
  
  body.style.background = backgroundMap[weatherMain] || "linear-gradient(135deg, #74b9ff, #0984e3)";
}

// Get 5-day forecast
async function getForecast(city) {
  try {
    const response = await fetch(forecastUrl + city + `&appid=${apiKey}`);
    const data = await response.json();
    displayForecast(data);
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
}

// Display forecast
function displayForecast(data) {
  const forecastContainer = document.querySelector(".forecast");
  if (!forecastContainer) return;
  
  forecastContainer.innerHTML = "";
  
  // Get daily forecasts (every 8th item = 24 hours)
  for (let i = 0; i < data.list.length; i += 8) {
    const forecast = data.list[i];
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="forecast-day">${day}</div>
      <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
      <div class="forecast-desc">${forecast.weather[0].description}</div>
    `;
    
    forecastContainer.appendChild(forecastItem);
  }
}

// Save search history
function saveToHistory(data) {
  const historyItem = {
    city: data.name,
    temp: Math.round(data.main.temp),
    weather: data.weather[0].main,
    timestamp: new Date().toISOString()
  };
  
  // Remove duplicates and limit to 5 items
  weatherHistory = weatherHistory.filter(item => item.city !== data.name);
  weatherHistory.unshift(historyItem);
  weatherHistory = weatherHistory.slice(0, 5);
  
  localStorage.setItem('weatherHistory', JSON.stringify(weatherHistory));
  displayHistory();
}

// Display search history
function displayHistory() {
  const historyContainer = document.querySelector(".history");
  if (!historyContainer) return;
  
  historyContainer.innerHTML = "<h3>Recent Searches</h3>";
  
  weatherHistory.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <span>${item.city}</span>
      <span>${item.temp}°C</span>
    `;
    historyItem.addEventListener('click', () => checkWeather(item.city));
    historyContainer.appendChild(historyItem);
  });
}

// Show loading animation
function showLoading(show) {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.style.display = show ? "block" : "none";
  }
}

// Show notifications
function showNotification(message, type = "info") {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 100);
  
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Auto-complete functionality
function setupAutoComplete() {
  const popularCities = [
    "London", "New York", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore",
    "Los Angeles", "Berlin", "Amsterdam", "Barcelona", "Rome", "Mumbai",
    "Bangkok", "Istanbul", "Cairo", "Lagos", "Nairobi", "Cape Town"
  ];
  
  searchBox.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    const suggestions = popularCities.filter(city => 
      city.toLowerCase().includes(value)
    );
    
    showSuggestions(suggestions.slice(0, 5));
  });
}

// Show city suggestions
function showSuggestions(suggestions) {
  let suggestionBox = document.querySelector(".suggestions");
  
  if (!suggestionBox) {
    suggestionBox = document.createElement('div');
    suggestionBox.className = 'suggestions';
    searchBox.parentNode.appendChild(suggestionBox);
  }
  
  suggestionBox.innerHTML = "";
  
  suggestions.forEach(city => {
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    suggestion.textContent = city;
    suggestion.addEventListener('click', () => {
      searchBox.value = city;
      checkWeather(city);
      suggestionBox.innerHTML = "";
    });
    suggestionBox.appendChild(suggestion);
  });
}

// Voice search functionality
function setupVoiceSearch() {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    const voiceBtn = document.querySelector(".voice-btn");
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        recognition.start();
        showNotification("Listening... Say a city name", "info");
      });
      
      recognition.onresult = (event) => {
        const city = event.results[0][0].transcript;
        searchBox.value = city;
        checkWeather(city);
        showNotification(`Searching for ${city}`, "success");
      };
      
      recognition.onerror = () => {
        showNotification("Voice recognition failed", "error");
      };
    }
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Enter key to search
  if (e.key === 'Enter' && document.activeElement === searchBox) {
    checkWeather(searchBox.value);
  }
  
  // Ctrl + L for location
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    getCurrentLocation();
  }
  
  // Escape to clear
  if (e.key === 'Escape') {
    searchBox.value = "";
    document.querySelector(".suggestions").innerHTML = "";
  }
});

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  displayHistory();
  setupAutoComplete();
  setupVoiceSearch();
  
  // Add location button functionality
  const locationBtn = document.querySelector(".location-btn");
  if (locationBtn) {
    locationBtn.addEventListener('click', getCurrentLocation);
  }
});

// Enhanced search button event
searchBtn.addEventListener("click", () => {
  if (searchBox.value.trim()) {
    checkWeather(searchBox.value);
  } else {
    showNotification("Please enter a city name", "error");
  }
});

// Auto-refresh every 10 minutes
setInterval(() => {
  if (currentCity) {
    checkWeather(currentCity);
    showNotification("Weather data refreshed", "success");
  }
}, 600000); // 10 minutes

// Unit conversion toggle
function toggleUnits() {
  const tempElements = document.querySelectorAll('.temp');
  // Add Celsius/Fahrenheit toggle functionality
  // Implementation depends on your UI structure
}
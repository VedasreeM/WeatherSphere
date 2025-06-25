class WeatherApp {
    constructor() {
        this.apiKey = 'd4cd41f2c0e6beb2270de6d13be98c5e'; // Replace with your OpenWeatherMap API key
        this.currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
        this.currentWeatherData = null;
        
        this.initializeElements();
        this.bindEvents();
        this.checkForCurrentLocation();
    }

    initializeElements() {
        this.elements = {
            locationInput: document.getElementById('locationInput'),
            searchBtn: document.getElementById('searchBtn'),
            currentLocationBtn: document.getElementById('currentLocationBtn'),
            loading: document.getElementById('loading'),
            weatherInfo: document.getElementById('weatherInfo'),
            errorMessage: document.getElementById('errorMessage'),
            locationName: document.getElementById('locationName'),
            currentTime: document.getElementById('currentTime'),
            weatherIcon: document.getElementById('weatherIcon'),
            temperature: document.getElementById('temperature'),
            weatherDescription: document.getElementById('weatherDescription'),
            feelsLike: document.getElementById('feelsLike'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure'),
            visibility: document.getElementById('visibility'),
            uvIndex: document.getElementById('uvIndex'),
            sunrise: document.getElementById('sunrise'),
            sunset: document.getElementById('sunset'),
            celsiusBtn: document.getElementById('celsiusBtn'),
            fahrenheitBtn: document.getElementById('fahrenheitBtn'),
            retryBtn: document.getElementById('retryBtn'),
            errorText: document.getElementById('errorText')
        };
    }

    bindEvents() {
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.currentLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        this.elements.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.elements.celsiusBtn.addEventListener('click', () => this.switchUnit('metric'));
        this.elements.fahrenheitBtn.addEventListener('click', () => this.switchUnit('imperial'));
        this.elements.retryBtn.addEventListener('click', () => this.retryLastSearch());
    }

    checkForCurrentLocation() {
        // Try to get user's current location on app load
        if (navigator.geolocation) {
            this.getCurrentLocation();
        } else {
            this.showError('Geolocation is not supported by this browser. Please enter a city name.');
        }
    }

    handleSearch() {
        const location = this.elements.locationInput.value.trim();
        if (!location) {
            this.showError('Please enter a city name');
            return;
        }
        this.searchByCity(location);
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.searchByCoordinates(latitude, longitude);
            },
            (error) => {
                let errorMessage = 'Unable to get your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                }
                this.showError(errorMessage);
            }
        );
    }

    async searchByCity(city) {
        this.showLoading();
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.currentUnit}`
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please check the spelling and try again.');
                } else if (response.status === 401) {
                    throw new Error('API key is invalid. Please check your API configuration.');
                } else {
                    throw new Error(`Weather service error: ${response.status}`);
                }
            }
            
            const data = await response.json();
            this.displayWeatherData(data);
        } catch (error) {
            this.showError(error.message || 'Failed to fetch weather data. Please try again.');
        }
    }

    async searchByCoordinates(lat, lon) {
        this.showLoading();
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentUnit}`
            );
            
            if (!response.ok) {
                throw new Error(`Weather service error: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayWeatherData(data);
        } catch (error) {
            this.showError(error.message || 'Failed to fetch weather data. Please try again.');
        }
    }

    displayWeatherData(data) {
        this.currentWeatherData = data;
        
        // Update location and time
        this.elements.locationName.textContent = `${data.name}, ${data.sys.country}`;
        this.elements.currentTime.textContent = new Date().toLocaleString();
        
        // Update weather icon
        const iconCode = data.weather[0].icon;
        this.elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        this.elements.weatherIcon.alt = data.weather[0].description;
        
        // Update temperature
        const temp = Math.round(data.main.temp);
        const unit = this.currentUnit === 'metric' ? '°C' : '°F';
        this.elements.temperature.textContent = `${temp}${unit}`;
        
        // Update description
        this.elements.weatherDescription.textContent = data.weather[0].description;
        const feelsLike = Math.round(data.main.feels_like);
        this.elements.feelsLike.textContent = `Feels like ${feelsLike}${unit}`;
        
        // Update weather details
        this.elements.humidity.textContent = `${data.main.humidity}%`;
        this.elements.windSpeed.textContent = this.formatWindSpeed(data.wind.speed);
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        this.elements.visibility.textContent = this.formatVisibility(data.visibility);
        
        // UV Index (not available in current weather API, showing placeholder)
        this.elements.uvIndex.textContent = 'N/A';
        
        // Sunrise and sunset
        this.elements.sunrise.textContent = this.formatTime(data.sys.sunrise);
        this.elements.sunset.textContent = this.formatTime(data.sys.sunset);
        
        this.showWeatherInfo();
    }

    formatWindSpeed(speed) {
        if (this.currentUnit === 'metric') {
            return `${speed} m/s`;
        } else {
            return `${speed} mph`;
        }
    }

    formatVisibility(visibility) {
        if (!visibility) return 'N/A';
        
        if (this.currentUnit === 'metric') {
            return `${(visibility / 1000).toFixed(1)} km`;
        } else {
            return `${(visibility / 1609.34).toFixed(1)} mi`;
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    switchUnit(unit) {
        if (this.currentUnit === unit) return;
        
        this.currentUnit = unit;
        
        // Update button states
        this.elements.celsiusBtn.classList.toggle('active', unit === 'metric');
        this.elements.fahrenheitBtn.classList.toggle('active', unit === 'imperial');
        
        // Re-fetch weather data with new unit if we have current data
        if (this.currentWeatherData) {
            const { coord } = this.currentWeatherData;
            this.searchByCoordinates(coord.lat, coord.lon);
        }
    }

    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.weatherInfo.style.display = 'none';
        this.elements.errorMessage.style.display = 'none';
    }

    showWeatherInfo() {
        this.elements.loading.style.display = 'none';
        this.elements.weatherInfo.style.display = 'block';
        this.elements.errorMessage.style.display = 'none';
    }

    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.weatherInfo.style.display = 'none';
        this.elements.errorMessage.style.display = 'block';
        this.elements.errorText.textContent = message;
    }

    retryLastSearch() {
        const location = this.elements.locationInput.value.trim();
        if (location) {
            this.searchByCity(location);
        } else {
            this.getCurrentLocation();
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Demo mode with mock data (remove this in production)
class WeatherAppDemo extends WeatherApp {
    constructor() {
        super();
        this.apiKey = 'demo'; // Override API key for demo
    }

    async searchByCity(city) {
        this.showLoading();
        // Simulate API delay
        setTimeout(() => {
            const mockData = this.getMockWeatherData(city);
            this.displayWeatherData(mockData);
        }, 1000);
    }

    async searchByCoordinates(lat, lon) {
        this.showLoading();
        // Simulate API delay
        setTimeout(() => {
            const mockData = this.getMockWeatherData('Current Location');
            this.displayWeatherData(mockData);
        }, 1000);
    }

    getMockWeatherData(location) {
        return {
            name: location,
            sys: { country: 'Demo' },
            weather: [
                {
                    description: 'clear sky',
                    icon: '01d'
                }
            ],
            main: {
                temp: 22,
                feels_like: 24,
                humidity: 65,
                pressure: 1013
            },
            wind: {
                speed: 3.5
            },
            visibility: 10000,
            sys: {
                sunrise: Math.floor(Date.now() / 1000) - 3600,
                sunset: Math.floor(Date.now() / 1000) + 7200
            },
            coord: {
                lat: 40.7128,
                lon: -74.0060
            }
        };
    }
}

// Use demo mode if no API key is provided
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if API key is set
        const testApp = new WeatherApp();
        if (testApp.apiKey === 'YOUR_API_KEY_HERE') {
            console.log('Running in demo mode. Get an API key from OpenWeatherMap for live data.');
            new WeatherAppDemo();
        } else {
            new WeatherApp();
        }
    });
}
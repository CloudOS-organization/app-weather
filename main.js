import {html , Type} from 'https://doc.typable.dev/js/deps.js';
import {Window} from 'https://doc.typable.dev/js/component/mod.js';

export default class Weather extends Window {
    static name = 'weather-app';
    static properties = {
        ...super.properties,
        weatherData: Type.object({}),
        weekWeatherData: Type.object({}),
        loading: Type.boolean(false),
        error: Type.boolean(false)
    };

    static ref = {
        ...super.ref,
        searchInput: 'input.js-weather-search'
    };

    constructor() {
        super();
        this.onAppLoading();
    }

    renderBody() {
        return html`
            <div class="weather__container">
                <div class="weather__search">
                    <input class="js-weather-search" @change=${this.onSearch} @keyup=${this.onSearchInput} type="text" placeholder="Suche nach Ort oder PLZ"/>
                </div>
                ${!this.loading && !this.error ? html`
                    <div>
                        <div class="weather__wrapper">
                            <div class="weather__icon">
                                <img src="http://openweathermap.org/img/wn/${this.weatherData?.weather?.[0]?.icon}@2x.png" alt="${this.weatherData?.weather?.[0]?.description}"/>
                                <span> ${this.weatherData?.weather?.[0]?.description} </span>
                            </div>
                            <div class="weather__temp">
                                <h1>${Math.ceil(this.weatherData?.main?.temp)} °</h1>
                                <span><img src="https://img.icons8.com/material/30/000000/marker--v1.png"/>${this.weatherData?.name}</span>
                            </div>
                        </div> 
                        <div class="weather__spacer"></div> 
                        <div class="weather__wrapper">
                            <div class="weather__wind">
                                <span>${this.weatherData?.wind?.speed} km/h</span>
                                <span>Wind</span>
                            </div>
                            <div class="weather__feels_like">
                            <span>${Math.ceil(this.weatherData?.main?.feels_like)} °</span>
                                <span>Gefühlt Temperatur</span>
                            </div>
                            <div class="weather__temp_max">
                                <span>${Math.ceil(this.weatherData?.main?.temp_max)} °</span>
                                <span>Maximale Temperatur</span>
                            </div>
                        </div>  
                        <div class="week-weather__container">
                            ${this.weekWeatherData?.daily?.map(dayWeatherData => {
                                return html`
                                    <div class="week-weather__item">
                                        
                                        <div class="image">
                                            <span>${new Date(dayWeatherData.dt * 1000).toLocaleDateString('de-DE', { weekday: 'long'})}</span>
                                            <div>${new Date(dayWeatherData.dt * 1000).toLocaleDateString('de-DE', {  year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        </div>
                                        <div class="image">  
                                            <img src="http://openweathermap.org/img/wn/${dayWeatherData?.weather?.[0]?.icon}@2x.png" alt="${dayWeatherData?.weather?.[0]?.description}"/>
                                            <span>${dayWeatherData.weather?.[0]?.description}</span>
                                        </div>
                                        <div>
                                            <span>Max ${dayWeatherData.temp.max} °</span>
                                            -
                                            <span>Min ${dayWeatherData.temp.min} °</span>
                                        </div>
                                    </div>
                                `;
                            })}
                        </div>
                    </div>
                `: !this.loading && this.error ? html`
                    <div class="error>
                        Error
                    </div>
                `: html`
                    <div class="loading__spinner">
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                    </div>
                `}
            </div>
        `; 
    }

    onAppLoading() { 
        if (!this.storage.get("location")) {
            this.storage.set("location", "Wildberg")
        }
        this.getWeatherData(this.storage.get("location"));
    }

    onSearchInput() {
    //     const searchValue = this.searchInput.value;
    //     if (searchValue.length > 3) {
    //         const requestUri = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=mongolian&inputtype=textquery&locationbias=circle%3A2000%4047.6918452%2C-122.2226413&fields=formatted_address%2Cname%2Crating%2Copening_hours%2Cgeometry&key=AIzaSyBCPitXXmZO7OFCJekr4Hhavsi6MbtKHd4`;
    //         const response = await fetch(requestUri, {mode: 'cors'});
    //         if (response.status !== 200) {
    //             console.log('Error: ', response);
    //         } else {
    //             console.log(response)
    //         }
    //     }
    }

    onSearch() {
        const searchValue = this.searchInput.value;
        this.getWeatherData(searchValue, true)
    }

    async getWeatherData(location, searchChanges = false) {
        if (!this.loading) {
            this.loading = true;
            const {API_KEY} = this.config.env;
            const requestUri = `https://api.openweathermap.org/data/2.5/weather?units=metric&lang=de&q=${location}&appid=${API_KEY}`
            const response = await fetch(requestUri)
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                this.error = true;
            } else {
                this.weatherData = await response.json();
                if (searchChanges) {
                    this.storage.set("location", this.weatherData.name);
                    this.cache.remove("weekWeatherData")
                }
                this.getWeekWeatherData(this.weatherData.coord.lat, this.weatherData.coord.lon);
            }
        }
    }

    async getWeekWeatherData(lat, lon) {
        if (!this.cache.get("weekWeatherData")) {
            const {API_KEY} = this.config.env;
            const requestUri = `https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly,alerts,current&units=metric&lang=de&lat=${lat}2&lon=${lon}&appid=${API_KEY}`
            const response = await fetch(requestUri);
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                this.error = true;
            } else {
                this.weekWeatherData = await response.json();
                this.cache.set("weekWeatherData", this.weekWeatherData);
            }
        } else {
            this.weekWeatherData = this.cache.get("weekWeatherData");
        }   
        this.loading = false;
    }
}

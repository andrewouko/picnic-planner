import { findNextOccuringDay, getArg, validateInput, getWeatherData, getPicnicFeedback, WeatherData, getTemperature } from './lib'

try{
    const city = getArg()
    validateInput('city', city)
    const next_saturday = findNextOccuringDay(new Date(), 6)
    const next_sunday = findNextOccuringDay(new Date(), 0)
    getWeatherData(city, 'metric', function(error: Error | null, result: WeatherData): void {
        if(error) throw new Error('Unable to get weather data. Message: ' + error.message)
        if(!result || !result.days.length) throw new Error('Weather data does not contain forecast for the next few days')
        const sat_temp = getTemperature(result, next_saturday)
        const sun_temp = getTemperature(result, next_sunday)
        console.log(getPicnicFeedback(sat_temp, sun_temp))
    })
} catch(error: any){
    console.error(error.message)
}
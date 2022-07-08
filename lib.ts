import * as CONFIG from './config.json'
require('dotenv').config()

const https = require('https');


type Day = {
    "datetime": string,
    "datetimeEpoch": number,
    "tempmax": number,
    "tempmin": number,
    "temp": number,
    "feelslikemax": number,
    "feelslikemin": number,
    "feelslike": number,
    "dew": number,
    "humidity": number,
    "precip": number,
    "precipprob": number,
    "precipcover": number,
    "preciptype": Array<string> | null,
    "snow": number,
    "snowdepth": number,
    "windgust": number,
    "windspeed": number,
    "winddir": number,
    "pressure": number,
    "cloudcover": number,
    "visibility": number,
    "solarradiation": number,
    "solarenergy": number,
    "uvindex": number,
    "severerisk": number,
    "sunrise": string,
    "sunriseEpoch": number,
    "sunset": string,
    "sunsetEpoch": number,
    "moonphase": number,
    "conditions": string,
    "description": string,
    "icon": string,
    "stations": object | null,
    "source": string,
    "hours": Array<object>
}
type WeatherData = {
    "queryCost": number,
    "latitude": number,
    "longitude": number,
    "resolvedAddress": string,
    "address": string,
    "timezone": string,
    "tzoffset": number,
    "description": string,
    "days": Array<Day>,
    alerts: Array<string>,
    stations: object,
    currentConditions: object
}
type Options = {
    hostname: string,
    path: string,
    method: string,
    headers?: object
}

function getArg(): string {
    const flags_to_exclude = CONFIG.excluded_flags
    const arg = process.argv.slice(2).filter(arg => !flags_to_exclude.includes(arg))[0]
    if(!arg) throw new Error('Failed to get an argument from the command line');
    return arg
}
function validateInput(arg: string, value: string): boolean {
    let res: boolean
    switch (arg) {
        case 'city':
            const city_name_pattern = new RegExp("^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$")
            res = city_name_pattern.test(value);
            break
        default:
            res = false
    }
    if(!res) throw new Error(`Invalid argument or value provided for validation. [arg]: ${arg} [value]: ${value.length ? value : '(empty)'}`)
    return res
}

function httpsRequest(options: Options, cb: (error: Error | null, result: any) => void) {

    https.request(options, function (res: any) {
        let body = ''
        res.on('data', function (chunk: string) {
            body += chunk
        });
        res.on('end', async () => {
            try {
                body = JSON.parse(body);
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    throw new Error(JSON.stringify({
                        message: body,
                        statusCode: res.statusCode
                    }))
                }
                cb(null, body)
            } catch (error: any) {
                cb(error, body)
            }
        })
    }).on('error', function (error: Error) {
        cb(error, null)
    }).end()
}
function getWeatherData(city: string, unit_group: string, cb: (error: Error | null, result: WeatherData) => void) {
    const API = CONFIG.API.visual_crossing

    const options = {
        hostname: API.BASE_URL,
        path: `${API.PATH.weather_data}/${encodeURIComponent(city.toLowerCase())}?unitGroup=${unit_group}&key=${process.env.VISUAL_CROSSING_WEATHER_DATA}&contentType=json`,
        method: 'GET'
    }

    httpsRequest(options, cb)
}

function findNextOccuringDay(from_date: Date, day_of_week: number): Date {
    day_of_week = Math.floor(day_of_week)
    if (day_of_week < 0 || day_of_week > 6) throw new Error(`Invalid argument for day of week. Must be between 0 and 6`)
    let diff = day_of_week - from_date.getDay()
    if (diff < 0) diff += 7
    const result = new Date(from_date.getTime())
    result.setDate(result.getDate() + diff);
    return result
}
function getTemperature(result: WeatherData, date: Date): number {
    const formatted_date = date.toISOString().split('T')[0]
    const weather = result.days.find(element => element.datetime === formatted_date)
    if (weather)
        return weather.temp
    else throw new Error(`Temperature extraction failed. Could not find weather for ${formatted_date}`)
}
function getPicnicFeedback(sat_temp: number, sun_temp: number): string {
    if (sat_temp < 10 && sun_temp < 10) {
        return 'The weather isn’t looking very good this weekend, maybe stay indoors.'
    } else if (sat_temp > 10 && sun_temp > 10) {
        return `This weekend looks nice for a picnic, ${sat_temp > sun_temp ? 'Saturday' : 'Sunday'} is best because it's hotter!.`
    } else {
        return `You should have your picnic on ${sat_temp > 10 ? 'Saturday' : 'Sunday'}.`
    }
}
export {
    getArg,
    validateInput,
    findNextOccuringDay,
    getTemperature,
    getPicnicFeedback,
    getWeatherData,
    WeatherData,
    httpsRequest,
    Options,
    CONFIG
};
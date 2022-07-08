import { validateInput, WeatherData, getWeatherData, CONFIG, findNextOccuringDay, getTemperature, getPicnicFeedback, getArg } from '../lib'
import * as nairobi_mock_data from './nairobi.json'
import nock from "nock";
const assert = require('assert');
describe('lib.ts test suite', () => {
    let original_argv : Array<string>;
    beforeEach(() => {
        original_argv = process.argv;
    });
    afterEach(() => {
        process.argv = original_argv;
    });
    it('should get the correct user argument from the cli', () => {
        process.argv = process.argv.concat([
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\node\\picnic-planner\\dist\\index.js',
            '--trace-warnings',
            '-c',
            'nairobi'
          ]);
        assert(getArg(), 'nairobi');
      });
    it('should pass the argument validation', () => {
        const arg = 'city'
        const value = 'nairobi'
        expect(validateInput(arg, value)).toEqual(true)
    })
    it('should fail the argument validation', () => {
        const arg = 'town'
        const value = 'nairobi'
        expect(() => {
            validateInput(arg, value)
        }).toThrow(`Invalid argument or value provided for validation. [arg]: ${arg} [value]: ${value.length ? value : '(empty)'}`)
    })
    it('Should get weather data', () => {
        nock(CONFIG.API.visual_crossing.BASE_URL)
            .get(CONFIG.API.visual_crossing.PATH.weather_data)
            .reply(200, JSON.stringify(nairobi_mock_data));
        getWeatherData('nairobi', 'metric', function (error: Error | null, result: WeatherData) {
            expect(error).toBe(null)
            expect(result).toEqual(nairobi_mock_data)
        })
    })
    it('Should fail to get weather data', () => {
        nock(CONFIG.API.visual_crossing.BASE_URL)
            .get(`${CONFIG.API.visual_crossing.PATH.weather_data}-intentionally-wrong-path`)
            .reply(400, CONFIG.API.visual_crossing.FAILED_WEATHER_TEXT);
        getWeatherData('nairobi', 'metric', function (error: Error | null, result: WeatherData) {
            expect(error).toEqual(CONFIG.API.visual_crossing.FAILED_WEATHER_TEXT)
            expect(result).toEqual(null)
        })
    })
    test('Next occurring saturday and sunday', () => {
        expect(findNextOccuringDay(new Date('2022-07-06'), 6)).toEqual(new Date('2022-07-09'))
        expect(findNextOccuringDay(new Date('2022-07-06'), 0)).toEqual(new Date('2022-07-10'))
    })
    test('the temperature for Saturday from mock results to be 18 degrees', () => {
        expect(getTemperature(nairobi_mock_data, new Date('2022-07-09'))).toEqual(16.2)
    })
    it('should fail to extract the temperature', () => {
        expect(() => getTemperature(nairobi_mock_data, new Date('2022-07-31'))).toThrow(`Temperature extraction failed. Could not find weather for 2022-07-31`)
    })
    it('should give the correct picnic feedback', () => {
        expect(getPicnicFeedback(9, 8)).toEqual('The weather isn’t looking very good this weekend, maybe stay indoors.')
        expect(getPicnicFeedback(18, 23)).toEqual(`This weekend looks nice for a picnic, Sunday is best because it's hotter!.`)
        expect(getPicnicFeedback(9, 10)).toEqual(`You should have your picnic on Sunday.`)
    })
});

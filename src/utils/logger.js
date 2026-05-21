/**
 * Consolidated Logger Utility Module
 * Standardizes time-zoned, colorized logging across the application.
 */

const moment = require('moment-timezone');
const colors = require('colors');
const config = require('../config');

/**
 * Custom console log decorator
 * @param {string} text - The log message text
 * @param {string} [type='info'] - The logging category ('info', 'success', 'warn', 'error')
 */
function logger(text, type = 'info') {
    // 1. Generate local timestamp formatted in the specified configuration timezone
    const timestamp = moment().tz(config.timezone).format('HH:mm:ss');
    const prefix = `[${timestamp}]`;
    
    // 2. Output to standard out styled with ANSI terminal colors depending on category
    switch (type) {
        case 'error':
            console.log(`${prefix.red} ${text}`);
            break;
        case 'success':
            console.log(`${prefix.green} ${text}`);
            break;
        case 'warn':
            console.log(`${prefix.yellow} ${text}`);
            break;
        default:
            console.log(`${prefix.blue} ${text}`);
    }
}

module.exports = logger;

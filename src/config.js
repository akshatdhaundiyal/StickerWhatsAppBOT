/**
 * Unified Configuration Resolver Module
 * Loads environment variables from local .env files via dotenv
 * and merges them with static fallbacks in config.json.
 */

require('dotenv').config();
const staticConfig = require('../config/config.json');

module.exports = {
    name: staticConfig.name || 'StickerBOT',
    author: staticConfig.author || 'akshatdhaundiyal',
    prefix: staticConfig.prefix || '!',
    timezone: staticConfig.timezone || 'Asia/Kolkata',
    groups: staticConfig.groups !== undefined ? staticConfig.groups : true,
    log: staticConfig.log !== undefined ? staticConfig.log : true,
    
    // Dynamic runtime mode switch ('web-automation' or 'official-api')
    mode: process.env.BOT_MODE || staticConfig.mode || 'web-automation',
    
    // Official WhatsApp Cloud API Configurations
    official: {
        accessToken: process.env.META_ACCESS_TOKEN || (staticConfig.official && staticConfig.official.accessToken),
        phoneNumberId: process.env.META_PHONE_NUMBER_ID || (staticConfig.official && staticConfig.official.phoneNumberId),
        verifyToken: process.env.META_VERIFY_TOKEN || (staticConfig.official && staticConfig.official.verifyToken) || 'sticker_bot_verify_token',
        port: process.env.PORT || (staticConfig.official && staticConfig.official.port) || 3000
    }
};

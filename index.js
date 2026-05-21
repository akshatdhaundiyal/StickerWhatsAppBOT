/**
 * Sticker WhatsApp Bot - Entry Point Bootstrapper
 * 
 * Injects core routing handlers, registers WebSocket message hooks,
 * and initializes browser automation via Puppeteer.
 * 
 * Configuration options can be set inside config/config.json.
 * Full architecture logs can be found in docs/architecture.md.
 */

const client = require('./src/client');
const handleMessage = require('./src/handlers/messageHandler');

// 1. Hook the message handler event dispatcher callback
client.on('message', handleMessage);

// 2. Spawn browser automation and initialize connections to WhatsApp servers
client.initialize();

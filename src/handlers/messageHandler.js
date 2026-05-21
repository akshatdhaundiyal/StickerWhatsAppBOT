/**
 * Message Event Controller & Router
 * Audits permissions (group constraints), matches incoming triggers,
 * and dynamically routes message execution contexts to corresponding command modules.
 */

const client = require('../client');
const config = require('../config');

// Import pluggable Command Modules
const stickerCmd = require('../commands/sticker');
const imageCmd = require('../commands/image');
const changeCmd = require('../commands/change');

/**
 * Message handler router
 * @param {object} message - The WhatsApp raw message payload
 */
async function handleMessage(message) {
    // 1. Identify chat origin type (group message vs direct message)
    const isGroups = message.from.endsWith('@g.us');
    
    // 2. Group authorization filter block (ignores commands in groups if groups is set to false)
    if (isGroups && !config.groups) {
        return;
    }

    const body = message.body || '';

    // 3. ROUTE: Image/Video/GIF to Sticker
    // Triggers automatically on media uploads OR if caption/body equals the sticker command
    if (
        message.type === 'image' || 
        message.type === 'video' || 
        message.type === 'gif' || 
        message._data?.caption === `${config.prefix}sticker` || 
        body === `${config.prefix}sticker`
    ) {
        return stickerCmd.execute(message, client, config);
    }

    // 4. ROUTE: Sticker to Image
    // Triggers automatically on sticker uploads OR if body equals the image command
    if (
        message.type === 'sticker' || 
        body === `${config.prefix}image`
    ) {
        return imageCmd.execute(message, client, config);
    }

    // 5. ROUTE: Custom Metadata Transcoding
    // Triggers when body starts with the change prefix command
    if (body.startsWith(`${config.prefix}change`)) {
        return changeCmd.execute(message, client, config);
    }

    // 6. DEFAULT: Read receipt generation
    // Marks other incoming text message chats as read/seen
    try {
        const chat = await client.getChatById(message.id.remote);
        if (chat) {
            await chat.sendSeen();
        }
    } catch (err) {
        // Silent block for uncritical read receipts issues (e.g. broadcast channels/offline statuses)
    }
}

module.exports = handleMessage;

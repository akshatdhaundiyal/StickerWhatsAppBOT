/**
 * Sticker-to-Image Extraction Command Module
 * Extracts standard visual images from WebP stickers. Supports direct sticker conversions and quoted reply commands.
 */

const logger = require('../utils/logger');

module.exports = {
    name: 'image',
    description: 'Convert sticker to image',
    async execute(message, client, config) {
        const sender = message.from.replace("@c.us", "");
        
        // 1. Establish the media target (direct incoming sticker vs. quoted text reply)
        let targetMsg = message;
        let isReply = false;
        
        // If message is explicitly the "#image" text command, check for quoted content
        if (message.body === `${config.prefix}image`) {
            if (message.hasQuotedMsg) {
                targetMsg = await message.getQuotedMessage();
                isReply = true;
            } else {
                return message.reply("*[❎]* Reply Sticker First!");
            }
        }
        
        // 2. Validate that target contains media stream
        if (!targetMsg || !targetMsg.hasMedia) {
            return message.reply(isReply ? "*[❎]* Reply Sticker First!" : "*[❎]* Failed to fetch media!");
        }

        if (config.log) logger(`${sender.yellow} convert sticker into image`);
        
        let loadingMsg;
        try {
            // 3. Send temporary status indicator
            loadingMsg = await client.sendMessage(message.from, "*[⏳]* Loading..");
            
            // 4. Download media stream buffer from WhatsApp Web servers
            const media = await targetMsg.downloadMedia();
            
            // 5. Send media back as standard image attachment (no sendMediaAsSticker metadata flag)
            await client.sendMessage(message.from, media);
            
            // 6. Return success alert
            await client.sendMessage(message.from, "*[✅]* Successfully!");
            
            // 7. Clean up status message
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        } catch (err) {
            // 8. Capture and print diagnostics
            logger(`Failed to convert sticker to image for ${sender}: ${err.message || err}`, 'error');
            client.sendMessage(message.from, "*[❎]* Failed!");
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        }
    }
};

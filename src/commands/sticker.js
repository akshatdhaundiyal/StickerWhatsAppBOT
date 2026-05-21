/**
 * Media-to-Sticker Conversion Command Module
 * Handles direct image, video, and GIF conversions, as well as quoted media replies.
 */

const logger = require('../utils/logger');

module.exports = {
    name: 'sticker',
    description: 'Convert media to sticker',
    async execute(message, client, config) {
        const sender = message.from.replace("@c.us", "");
        
        // 1. Establish the media target (direct message media vs. quoted text reply)
        let targetMsg = message;
        let isReply = false;
        
        // If message is explicitly the "#sticker" text command, check for quoted content
        if (message.body === `${config.prefix}sticker`) {
            if (message.hasQuotedMsg) {
                targetMsg = await message.getQuotedMessage();
                isReply = true;
            } else {
                return message.reply("*[❎]* Reply Image First!");
            }
        }
        
        // 2. Validate that target actually contains a media download stream
        if (!targetMsg || !targetMsg.hasMedia) {
            return message.reply(isReply ? "*[❎]* Reply Image First!" : "*[❎]* Failed to fetch media!");
        }

        if (config.log) logger(`${sender.yellow} created sticker`);
        
        let loadingMsg;
        try {
            // 3. Send temporary status indicator
            loadingMsg = await client.sendMessage(message.from, "*[⏳]* Loading..");
            
            // 4. Download media stream buffer from WhatsApp Web servers
            const media = await targetMsg.downloadMedia();
            
            // 5. Direct FFmpeg conversion pipeline (auto-converts buffer into WebP sticker format)
            await client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerName: config.name,
                stickerAuthor: config.author
            });
            
            // 6. Return execution success alert
            await client.sendMessage(message.from, "*[✅]* Successfully!");
            
            // 7. Clean up temporary status indicator from chat context
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        } catch (err) {
            // 8. Dynamic diagnostics log on failure cases
            logger(`Failed to create sticker for ${sender}: ${err.message || err}`, 'error');
            client.sendMessage(message.from, "*[❎]* Failed!");
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        }
    }
};

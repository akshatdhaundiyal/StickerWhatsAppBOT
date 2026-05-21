/**
 * Dynamic Metadata Change Command Module
 * Extracts media from a quoted message and transcodes it into a WebP sticker
 * with user-defined dynamic name and author fields.
 */

const logger = require('../utils/logger');

module.exports = {
    name: 'change',
    description: 'Change sticker properties',
    async execute(message, client, config) {
        const sender = message.from.replace("@c.us", "");
        
        // 1. Ensure the syntax contains the separator pipe symbol
        if (!message.body.includes('|')) {
            return message.reply(`*[❎]* Run the command :\n*${config.prefix}change <name> | <author>*`);
        }

        // 2. Parse out customized name and author fields, stripping extra spaces
        let name = message.body.split('|')[0].replace(message.body.split(' ')[0], '').trim();
        let author = message.body.split('|')[1].trim();

        // 3. Confirm message has quoted media
        if (!message.hasQuotedMsg) {
            return message.reply("*[❎]* Reply Sticker First!");
        }

        const quotedMsg = await message.getQuotedMessage();
        if (!quotedMsg || !quotedMsg.hasMedia) {
            return message.reply("*[❎]* Reply Sticker First!");
        }

        if (config.log) logger(`${sender.yellow} change the author name on the sticker`);

        let loadingMsg;
        try {
            // 4. Send temporary status indicator
            loadingMsg = await client.sendMessage(message.from, "*[⏳]* Loading..");
            
            // 5. Download source media stream buffer
            const media = await quotedMsg.downloadMedia();
            
            // 6. Transcode with custom metadata inputs
            await client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerName: name,
                stickerAuthor: author
            });
            await client.sendMessage(message.from, "*[✅]* Successfully!");
            
            // 7. Clean up loading status message
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        } catch (err) {
            // 8. Capture and print diagnostics
            logger(`Failed to change sticker properties for ${sender}: ${err.message || err}`, 'error');
            client.sendMessage(message.from, "*[❎]* Failed!");
            if (loadingMsg) await loadingMsg.delete(true).catch(() => {});
        }
    }
};

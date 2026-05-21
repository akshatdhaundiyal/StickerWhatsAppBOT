/**
 * WhatsApp Client Initialization & Lifecycle Event Manager (Dual-Mode Router)
 * Supports 'web-automation' (via Puppeteer & whatsapp-web.js) and 'official-api' (via Express HTTP Webhook).
 * Unifies the event emitter API and mock message layer so the core bot commands and handlers are agnostic.
 */

const EventEmitter = require('events');
const express = require('express');
const fs = require('fs');
const colors = require('colors');
const qrcode = require('qrcode-terminal');
const ffmpegPath = require('ffmpeg-static');
const { Client, LocalAuth } = require('whatsapp-web.js');

const config = require('./config');
const logger = require('./utils/logger');
const officialEngine = require('./services/officialEngine');

let client;

// ==========================================
// Mode: Official Cloud API
// ==========================================
if (config.mode === 'official-api') {
    class OfficialClient extends EventEmitter {
        constructor() {
            super();
            this.config = config;
            // In-memory cache to store recent message payloads so stateless webhook quoted replies can fetch parents
            this.messageCache = new Map();
        }

        /**
         * Initialize the Official Webhook Server
         */
        async initialize() {
            const app = express();
            app.use(express.json());

            // 1. GET /webhook - Meta webhook registration verification handshake
            app.get('/webhook', (req, res) => {
                const mode = req.query['hub.mode'];
                const token = req.query['hub.verify_token'];
                const challenge = req.query['hub.challenge'];

                if (mode && token) {
                    if (mode === 'subscribe' && token === this.config.official.verifyToken) {
                        logger('Webhook successfully verified by Meta.', 'success');
                        return res.status(200).send(challenge);
                    } else {
                        logger('Webhook verification failed: token mismatch.', 'warn');
                        return res.sendStatus(403);
                    }
                }
                return res.sendStatus(400);
            });

            // 2. POST /webhook - Receives WhatsApp event triggers (messages, status updates)
            app.post('/webhook', async (req, res) => {
                try {
                    const body = req.body;
                    if (body.object === 'whatsapp_business_account') {
                        for (const entry of body.entry || []) {
                            for (const change of entry.changes || []) {
                                const value = change.value;
                                if (!value || !value.messages) continue;

                                for (const rawMsg of value.messages) {
                                    if (!rawMsg.from) continue;

                                    // Map Meta sender ID into a standard JID-like syntax for commands
                                    const senderJid = `${rawMsg.from}@c.us`;
                                    const messageId = rawMsg.id;
                                    let msgBody = '';
                                    let msgType = rawMsg.type;
                                    let mediaId = null;
                                    let mimetype = null;

                                    // Extract data based on message type
                                    if (msgType === 'text') {
                                        msgBody = rawMsg.text?.body || '';
                                    } else if (msgType === 'image') {
                                        msgBody = rawMsg.image?.caption || '';
                                        mediaId = rawMsg.image?.id;
                                        mimetype = rawMsg.image?.mime_type;
                                    } else if (msgType === 'video') {
                                        msgBody = rawMsg.video?.caption || '';
                                        mediaId = rawMsg.video?.id;
                                        mimetype = rawMsg.video?.mime_type;
                                    } else if (msgType === 'sticker') {
                                        mediaId = rawMsg.sticker?.id;
                                        mimetype = rawMsg.sticker?.mime_type || 'image/webp';
                                    } else if (msgType === 'document') {
                                        mediaId = rawMsg.document?.id;
                                        mimetype = rawMsg.document?.mime_type;
                                    }

                                    const hasMedia = !!mediaId;
                                    let hasQuotedMsg = false;
                                    let quotedMsgId = null;
                                    if (rawMsg.context && rawMsg.context.id) {
                                        hasQuotedMsg = true;
                                        quotedMsgId = rawMsg.context.id;
                                    }

                                    const messageData = {
                                        id: {
                                            fromMe: false,
                                            remote: senderJid,
                                            id: messageId,
                                            _serialized: `${senderJid}_${messageId}`
                                        },
                                        from: senderJid,
                                        body: msgBody,
                                        type: msgType,
                                        hasMedia: hasMedia,
                                        mediaId: mediaId,
                                        mimetype: mimetype,
                                        hasQuotedMsg: hasQuotedMsg,
                                        quotedMsgId: quotedMsgId,
                                        timestamp: parseInt(rawMsg.timestamp, 10)
                                    };

                                    // Cache message details locally
                                    this.messageCache.set(messageId, messageData);
                                    if (this.messageCache.size > 500) {
                                        const firstKey = this.messageCache.keys().next().value;
                                        this.messageCache.delete(firstKey);
                                    }

                                    // Formulate unified mock message interface mimicking whatsapp-web.js
                                    const mockMessage = {
                                        ...messageData,
                                        
                                        // Inline reply support
                                        reply: async (text) => {
                                            return this.sendMessage(senderJid, text);
                                        },
                                        
                                        // Media download handler wrapping Graph CDN APIs
                                        downloadMedia: async () => {
                                            if (!mediaId) {
                                                throw new Error('No media ID available on this message.');
                                            }
                                            logger(`Downloading media ID ${mediaId} via official engine...`, 'info');
                                            const buffer = await officialEngine.downloadMedia(mediaId);
                                            return {
                                                mimetype: mimetype || 'image/jpeg',
                                                data: buffer.toString('base64'),
                                                filename: 'downloaded_media'
                                            };
                                        },

                                        // Quoted message handler mapping context back to in-memory state
                                        getQuotedMessage: async () => {
                                            if (!hasQuotedMsg || !quotedMsgId) {
                                                return null;
                                            }
                                            const cachedParent = this.messageCache.get(quotedMsgId);
                                            if (!cachedParent) {
                                                logger(`Quoted parent message ID ${quotedMsgId} not found in-memory cache.`, 'warn');
                                                return null;
                                            }
                                            return {
                                                ...cachedParent,
                                                reply: async (text) => {
                                                    return this.sendMessage(senderJid, text);
                                                },
                                                downloadMedia: async () => {
                                                    if (!cachedParent.mediaId) {
                                                        throw new Error('No media ID available on this quoted message.');
                                                    }
                                                    const buffer = await officialEngine.downloadMedia(cachedParent.mediaId);
                                                    return {
                                                        mimetype: cachedParent.mimetype || 'image/jpeg',
                                                        data: cachedParent.data || buffer.toString('base64'),
                                                        filename: 'downloaded_media'
                                                    };
                                                }
                                            };
                                        }
                                    };

                                    // Dispatch incoming events to message controller
                                    this.emit('message', mockMessage);
                                }
                            }
                        }
                        return res.sendStatus(200);
                    }
                    return res.sendStatus(404);
                } catch (err) {
                    logger(`Webhook routing callback error: ${err.message || err}`, 'error');
                    return res.sendStatus(500);
                }
            });

            // 3. Listen on the configured HTTP Port
            const port = this.config.official.port;
            app.listen(port, () => {
                console.clear();
                const consoleText = './config/console.txt';
                fs.readFile(consoleText, 'utf-8', (err, banner) => {
                    if (err) {
                        logger("Console text not found!", 'warn');
                        logger(`${this.config.name} (Official Cloud API) is listening on port ${port}!`, 'success');
                    } else {
                        console.log(banner.green);
                        logger(`${this.config.name} (Official Cloud API) is listening on port ${port}!`, 'success');
                    }
                });
                // Trigger ready callbacks
                this.emit('ready');
            });
        }

        /**
         * Unified Send Message Routine
         * Handles stickers, pictures, documents, and standard text messages.
         */
        async sendMessage(to, content, options = {}) {
            const cleanTo = to.replace('@c.us', '').replace('@g.us', '');
            let sentPayload = {};

            // Determine if the content parameter contains raw base64 media stream
            if (content && typeof content === 'object' && content.data) {
                const mediaBuffer = Buffer.from(content.data, 'base64');

                if (options.sendMediaAsSticker) {
                    logger(`Converting message buffer to a standard static WebP sticker...`, 'info');
                    // Transcode buffer to standard 1:1 WebP format under 100KB limits
                    const stickerBuffer = await officialEngine.compressToStaticWebP(mediaBuffer);

                    logger(`Uploading sticker to Meta CDN...`, 'info');
                    const stickerMediaId = await officialEngine.uploadMedia(stickerBuffer, 'image/webp', 'sticker.webp');

                    logger(`Delivering sticker media ID ${stickerMediaId}...`, 'info');
                    sentPayload = await officialEngine.sendRawMessage(cleanTo, {
                        type: 'sticker',
                        sticker: { id: stickerMediaId }
                    });
                } else {
                    logger(`Uploading standard media format ${content.mimetype} to Meta CDN...`, 'info');
                    const mediaId = await officialEngine.uploadMedia(mediaBuffer, content.mimetype, content.filename || 'file');

                    let msgType = 'document';
                    if (content.mimetype.startsWith('image/')) {
                        msgType = 'image';
                    } else if (content.mimetype.startsWith('video/')) {
                        msgType = 'video';
                    } else if (content.mimetype.startsWith('audio/')) {
                        msgType = 'audio';
                    }

                    logger(`Delivering standard media type ${msgType} media ID ${mediaId}...`, 'info');
                    sentPayload = await officialEngine.sendRawMessage(cleanTo, {
                        type: msgType,
                        [msgType]: { id: mediaId }
                    });
                }
            } else {
                // Deliver raw text payload
                sentPayload = await officialEngine.sendRawMessage(cleanTo, {
                    type: 'text',
                    text: { body: String(content) }
                });
            }

            // Return mock wrapper supporting delete()
            return {
                id: sentPayload.messages?.[0]?.id,
                from: to,
                body: typeof content === 'string' ? content : '',
                delete: async () => {
                    // Official Meta API does not natively support instant client message retraction
                    return Promise.resolve();
                }
            };
        }

        /**
         * Mock Chat Fetcher
         */
        async getChatById(chatId) {
            return {
                id: chatId,
                sendSeen: async () => {
                    return Promise.resolve();
                }
            };
        }
    }

    client = new OfficialClient();

} else {
    // ==========================================
    // Mode: Browser Automation (web-automation)
    // ==========================================
    client = new Client({
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
        },
        webVersionCache: { 
            type: 'remote', 
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2403.2.html'
        },
        ffmpeg: ffmpegPath,
        authStrategy: new LocalAuth({ clientId: "client" })
    });

    client.on('qr', (qr) => {
        logger("Scan the QR below : ");
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.clear();
        const consoleText = './config/console.txt';
        
        fs.readFile(consoleText, 'utf-8', (err, data) => {
            if (err) {
                logger("Console Text not found!", 'warn');
                logger(`${config.name} is Already!`, 'success');
            } else {
                console.log(data.green);
                logger(`${config.name} is Already!`, 'success');
            }
        });
    });
}

module.exports = client;


# Milestone 01 - Dual-Mode Switch & Official API Integration

This design document specifies the architecture, data structures, and implementation specifications for **Milestone 01: Dual-Mode Switch & Official API Integration** (Completed).

---

## 🎯 Objectives
The primary objective of this milestone was to design and implement a flexible dual-client runtime that allows users to seamlessly switch between Puppeteer browser automations and the official WhatsApp Business Cloud APIs without editing any core command files or business logic.

Key achievements:
1. **Dynamic Environment Controls:** Load secrets dynamically from local `.env` files or secure production scopes (e.g. GitHub Secrets) using `dotenv`.
2. **Unified Client Wrapper API:** Bridge differences in event handling and message parsing, wrapping both clients under standard event emitters and mock models.
3. **Robust Official CDN & FFmpeg Pipeline:** Download binary resources from Meta Graph endpoints, aggressively transcode them under 100KB limits via static local FFmpeg, and dispatch structured stickers.

---

## 🛠️ System Specifications

### 1. Environment Configurations & Dynamic Resolver
We introduced a centralized config resolver (`src/config.js`) that safely parses environment secret boundaries and merges them with user defaults:

| Secret / Config Key | Description | Default Fallback |
| :--- | :--- | :--- |
| `BOT_MODE` | Active bot client: `web-automation` or `official-api` | `web-automation` |
| `META_ACCESS_TOKEN` | Meta Graph API access token | `undefined` |
| `META_PHONE_NUMBER_ID` | Meta WhatsApp phone number identifier | `undefined` |
| `META_VERIFY_TOKEN` | Verify token used during webhook challenge handshake | `sticker_bot_verify_token` |
| `PORT` | Listening port for Express web webhook server | `3000` |

---

### 2. Stateless Webhook & Reference Caching (`src/client.js`)
Unlike persistent browser sockets, Webhooks are completely stateless. To support quoted message references (e.g., replying `#sticker` or `#image` to an existing media message), we built an in-memory `messageCache` inside the `OfficialClient` server:

```javascript
// Build standard cache mapping context
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

// Store message context with cache ceiling to avoid leaks (last 500 messages)
this.messageCache.set(messageId, messageData);
```

When commands invoke `message.getQuotedMessage()`, the mock client queries the cache using `quotedMsgId` to rebuild standard reference models, including dedicated `.downloadMedia()` bindings to download original binary buffers from Meta's secure Graph CDN.

---

### 3. Media Compressing & Meta Cloud Deliveries (`src/services/officialEngine.js`)
Sticker media sent through the WhatsApp Business API has an absolute file constraint of **100 KB** (and must be in 1:1 WebP format).

To solve this, we implemented:
1. **Dynamic Transcoder Scaling**: Configured local FFmpeg arguments (`-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:...`) to pad, crop, and transcode standard image streams into exactly 512x512 square grids.
2. **Aggressive Quality Compression**: Set visual quantization filters (`-q:v 50`) to dynamically squeeze and maintain file sizes safely below the 100KB CDN target.
3. **Multipart/Form-Data Formulations**: Programmatically constructed secure multipart uploads to deliver the WebP buffer back to Meta's `/media` endpoint and retrieve an upload ID for delivery.

---

## 📂 Document History

| Date | Author | Version | Notes |
| :--- | :--- | :--- | :--- |
| 2026-05-21 | akshatdhaundiyal | v1.0.0 | Initial completed specification documentation published. |

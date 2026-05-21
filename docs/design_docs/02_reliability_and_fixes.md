# Milestone 02 - Reliability & Stability Upgrades

This design document specifies the architecture, strategy, and concrete implementation patterns planned for **Milestone 02: Reliability & Stability Upgrades**.

---

## 🎯 Objectives
The primary objective of this milestone is to transform the Sticker Bot from a hobbyist script into a highly robust service capable of running continuously for months on remote environments (e.g., Ubuntu VPS, Docker containers) without memory degradation or silent connection drops.

Key metrics to address:
1. **Zero Memory Leaks:** Standard headless Chrome instances consume large amounts of memory if tabs and browser sessions are not explicitly managed and recycled.
2. **Infinite Session Recovery:** Handlers to cleanly recover from network dropouts or dynamic IP changes.
3. **Stream Auditing:** Gracefully intercept corrupted media formats without crashing the event loops.

---

## 🛠️ Proposed Specifications

### 1. Puppeteer Resource Tuning & Tab Pools
Currently, the client launches a single headless browser instance and keeps it open permanently. As sticker operations download media, tabs are created and data is allocated in Chromium.

#### Proposed Design:
Implement active cleanups of the page cache. If we scale to concurrent users in the future, we will transition to a **Page Pool/Context Pool** pattern where page objects are recycled periodically. For this single-client setup, we will configure:
* **Max Memory Allocation:** Run Puppeteer with memory-limit CLI arguments (`--js-flags="--max-old-space-size=512"`).
* **Cache Cleanups:** Configure cron timers to periodically invoke browser garbage collection if possible.

---

### 2. Resilient Connection & Re-authentication Manager
Currently, `restartOnAuthFail` is configured to `true` but there is no custom handler configured to recover gracefully when authentication files are corrupted or dynamic session handshakes fail.

#### Proposed Design:
Update `src/client.js` to listen to failure events and trigger cleanups:

```javascript
client.on('auth_failure', (msg) => {
    logger(`Authentication failed: ${msg}. Attempting to clean session data...`, 'error');
    // 1. Delete session files in .wwebjs_auth/ safely
    // 2. Re-trigger client.initialize() to prompt for a new QR code
});

client.on('disconnected', (reason) => {
    logger(`Client was disconnected: ${reason}. Re-initializing client...`, 'warn');
    client.initialize();
});
```

---

### 3. Stream Sanitization & Media Pipeline Protections
Occasionally, users may send media that is corrupted, has unsupported video codecs, or is too massive to download safely. If `downloadMedia()` is invoked on these files, it can freeze Node's processing or consume excessive buffer space.

#### Proposed Design:
Enhance the Media Pipeline to audit sizes and types:
1. **File Size Check:** Query `message.size` (if provided by WhatsApp's raw metadata) before downloading the buffer. If the size exceeds 16MB, reject the sticker creation immediately.
2. **Transcoding Timeout:** Wrap FFmpeg subprocess execution in a strict timeout promise. If the transcode takes more than 15 seconds (e.g., highly complex animated GIF), abort the process and return a `*[❎]* Timeout during transcoding` message instead of hanging Node.js.

---

## 📂 Document History

| Date | Author | Version | Notes |
| :--- | :--- | :--- | :--- |
| 2026-05-21 | Antigravity AI | v1.0.0 | Initial specifications drafted under Milestone 02. |

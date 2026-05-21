# StickerWhatsAppBOT

<p align="center">
  <img alt="@stickerwhatsappbot" style="width: 150px; border-radius: 20px;" src="https://github.com/DrelezTM/StickerWhatsAppBOT/assets/72683265/d3d504a6-7ce4-4937-8182-c37b8a86b456">
</p>

<div align="center">
  <h3>StickerWhatsAppBOT</h3>
  <p>A modern, highly optimized, and modular WhatsApp Sticker Creator Bot built with <a href="https://github.com/pedroslopez/whatsapp-web.js/">whatsapp-web.js</a> and <a href="https://nodejs.org/en/">Node.js</a>.</p>
</div>

<div align="center">
  <a href="#-warning">Warning</a> | 
  <a href="https://dsc.gg/DrelezTM">Report Bug</a> | 
  <a href="https://github.com/DrelezTM/StickerWhatsAppBOT/issues">Issues</a> | 
  <a href="#-project-architecture">Architecture</a>
</div>

---

## 🚀 Key Features

* **High Performance Media Transcoding:** Uses a dynamically loaded static dependency (`ffmpeg-static`) for cross-platform, fast video-to-sticker conversions.
* **Command Pattern Architecture:** Pluggable command structures under `src/commands/` for isolated command operations.
* **Auto-Cleanup Utilities:** Dynamically intercepts and deletes bot loading messages to prevent group or DM text spam.
* **Multi-Format Conversions:**
  * Image ➔ Static WebP Sticker (Auto & Command)
  * Video/GIF ➔ Animated WebP Sticker (Auto & Command)
  * Sticker ➔ Static Image (Command & Reply)
  * Custom Metadata Sticker Creator (Command & Reply)

---

## 📦 Project Directory Layout

```
├── config/
│   ├── config.json        # Core configurations (credentials, prefixes, logs)
│   └── console.txt        # Decorative ASCII console banner
├── docs/
│   ├── design_docs/
│   │   ├── 00_milestone_summary.md # Long-term features roadmap
│   │   └── 01_reliability_and_fixes.md # Stability specification draft
│   └── architecture.md    # Detailed system architecture document
├── src/
│   ├── utils/
│   │   └── logger.js      # Color-coded, time-zoned logging helper
│   ├── client.js          # Puppeteer & WhatsApp client configuration
│   ├── handlers/
│   │   └── messageHandler.js # Event dispatcher and permission router
│   └── commands/
│       ├── sticker.js     # Media to WebP sticker conversion engine
│       ├── image.js       # Sticker to raw image extraction engine
│       └── change.js      # Custom metadata sticker generator
├── index.js               # Clean, minimal bootstrapper entrypoint
├── package.json           # Dependecy manifests
└── .gitignore             # Git exclusion rules
```

---

## 📑 Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/en/) (v16+ recommended)
* A WhatsApp account to scan the authorization QR code.

### 1. Clone the Repository
```bash
git clone https://github.com/DrelezTM/StickerWhatsAppBOT
cd StickerWhatsAppBOT
```

### 2. Install Dependencies
```bash
npm install
```
*(Note: Installs `ffmpeg-static` automatically, providing the platform-specific FFmpeg binary for Windows, macOS, or Linux).*

### 3. Configure the Bot
Adjust credentials, metadata, and toggles inside `config/config.json`.

### 4. Start the Application
```bash
npm start
```

### 5. Authentication
Scan the generated terminal-friendly QR code using your WhatsApp Linked Devices panel:

<p align="center">
  <img alt="Scan QR" src="https://github.com/DrelezTM/StickerWhatsAppBOT/assets/72683265/2ce59cf0-f26b-4cd0-be1a-12f985720ad9" width="300">
</p>

---

## 🗝 Configuration Specs (`config/config.json`)

The bot read options dynamically from `config/config.json`:

```json
{
  "name": "StickerBOT",
  "author": "akshatdhaundiyal",
  "prefix": "!",
  "timezone": "Asia/Kolkata",
  "groups": true,
  "log": true
}
```

* **`name`**: The sticker pack metadata name (String).
* **`author`**: The sticker pack author/creator metadata name (String).
* **`prefix`**: The prefix trigger character for command routing (String).
* **`timezone`**: The timezone identifier used for timestamped console log styling (String).
* **`groups`**: Toggle allowing or blocking bot command responses in group chats (Boolean).
* **`log`**: Toggle to enable or disable printing execution success to the console (Boolean).

---

## 💭 Bot Commands Reference

| Command | Usage Context | Description |
| :--- | :--- | :--- |
| `[Media]` | Send Image/Video/GIF directly | Automatically converts incoming media to a sticker. |
| `!sticker` | Send `!sticker` in caption or as reply | Converts the target image, video, or GIF into a sticker. |
| `!image` | Reply to a sticker with `!image` | Unpacks a WhatsApp WebP sticker and returns a standard image. |
| `!change <name> \| <author>` | Reply to media with custom values | Transcodes the media using customized on-the-fly metadata values. |

---

## 🏗 Project Architecture

To learn more about how the headless browser automation, event routing pipelines, and FFmpeg transcoding flows are wired, please review the comprehensive architecture spec sheet:
📄 **[docs/architecture.md](file:///d:/lab/projects/StickerWhatsAppBOT/docs/architecture.md)**

---

## 🐞 Report Errors & Issues

* **Discord Server:** [Join Discord](https://dsc.gg/DrelezTM)
* **YouTube Channel:** [Watch tutorials](https://www.youtube.com/p/DrelezTM)
* **Instagram Profile:** [Follow updates](https://www.instagram.com/DrelezTM)
* **GitHub Issues:** [Open Issue](https://github.com/DrelezTM/StickerWhatsAppBOT/issues)

---

## 📜 License & Warnings

### Warning 🚧
Only works on standard desktop/server environments (Windows, macOS, and Linux). **Cannot run on mobile environments like Android/Termux** due to headless Chromium architecture dependencies.

### License 📜
Distributed under the MIT License. See [LICENSE](file:///d:/lab/projects/StickerWhatsAppBOT/LICENSE) for more information.

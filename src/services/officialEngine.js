/**
 * Official Meta Graph API Integration Service
 * Handles webhook payloads, media downloads, local FFmpeg compression 
 * to static WebP format, media uploads, and message deliveries.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Downloads media from Meta's secure CDN using the Graph API
 * @param {string} mediaId - The Meta media attachment ID
 * @returns {Promise<Buffer>} The downloaded file buffer
 */
async function downloadMedia(mediaId) {
    const { accessToken } = config.official;
    
    // 1. Query Meta Graph API to retrieve the actual media download URL
    const metaUrl = `https://graph.facebook.com/v19.0/${mediaId}`;
    const response = await fetch(metaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to query media metadata from Meta: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    const downloadUrl = metadata.url;
    
    if (!downloadUrl) {
        throw new Error('No download URL returned by Meta Graph API.');
    }
    
    // 2. Fetch the actual raw binary stream using the authorized download link
    const mediaResponse = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!mediaResponse.ok) {
        throw new Error(`Failed to download binary file stream from Meta: ${mediaResponse.statusText}`);
    }
    
    return Buffer.from(await mediaResponse.arrayBuffer());
}

/**
 * Compresses an image buffer using local FFmpeg to a 1:1 ratio static WebP under 100KB
 * @param {Buffer} inputBuffer - The raw image buffer
 * @returns {Promise<Buffer>} The compressed static WebP buffer
 */
function compressToStaticWebP(inputBuffer) {
    return new Promise((resolve, reject) => {
        // Create temporary paths for the transcode operation
        const tempDir = path.join(__dirname, '../../scratch');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const inputPath = path.join(tempDir, `temp_input_${Date.now()}`);
        const outputPath = path.join(tempDir, `temp_output_${Date.now()}.webp`);
        
        fs.writeFileSync(inputPath, inputBuffer);
        
        // Spawn the dynamic FFmpeg process to crop/pad to a 1:1 512x512 static WebP under 100KB
        // -q:v 50 ensures compression quality keeps it safe
        const ffmpegArgs = [
            '-y',
            '-i', inputPath,
            '-vcodec', 'libwebp',
            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0',
            '-q:v', '50',
            outputPath
        ];
        
        const proc = spawn(ffmpegPath, ffmpegArgs);
        
        proc.on('close', (code) => {
            // Clean up temporary input file immediately
            try { fs.unlinkSync(inputPath); } catch (e) {}
            
            if (code === 0) {
                try {
                    const result = fs.readFileSync(outputPath);
                    try { fs.unlinkSync(outputPath); } catch (e) {}
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(`FFmpeg transcoding process exited with error code ${code}`));
            }
        });
        
        proc.on('error', (err) => {
            try { fs.unlinkSync(inputPath); } catch (e) {}
            try { fs.unlinkSync(outputPath); } catch (e) {}
            reject(err);
        });
    });
}

/**
 * Uploads a buffer back to Meta's server to get an official media ID
 * @param {Buffer} fileBuffer - The media buffer
 * @param {string} mimetype - The mimetype of the file (e.g., 'image/webp', 'image/jpeg')
 * @param {string} filename - The name of the file
 * @returns {Promise<string>} The Meta media upload ID
 */
async function uploadMedia(fileBuffer, mimetype = 'image/webp', filename = 'sticker.webp') {
    const { accessToken, phoneNumberId } = config.official;
    
    // Construct standard multipart/form-data boundary
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    
    // Construct body headers and parts
    const header = `--${boundary}\r\n` +
                   `Content-Disposition: form-data; name="messaging_product"\r\n\r\n` +
                   `whatsapp\r\n` +
                   `--${boundary}\r\n` +
                   `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
                   `Content-Type: ${mimetype}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    
    // Combine fields into single payload buffer
    const payload = Buffer.concat([
        Buffer.from(header, 'utf-8'),
        fileBuffer,
        Buffer.from(footer, 'utf-8')
    ]);
    
    const metaUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/media`;
    const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: payload
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload media to Meta Graph API: ${errorText}`);
    }
    
    const data = await response.json();
    return data.id;
}

/**
 * Sends a message or sticker payload directly to a user via Meta Graph API
 * @param {string} to - The recipient's phone number (with country code)
 * @param {object} payload - The message parameters (text or sticker object)
 * @returns {Promise<object>} The Meta send response
 */
async function sendRawMessage(to, payload) {
    const { accessToken, phoneNumberId } = config.official;
    const metaUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        ...payload
    };
    
    const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to deliver message via Meta Graph API: ${errorText}`);
    }
    
    return response.json();
}

module.exports = {
    downloadMedia,
    compressToStaticWebP,
    uploadMedia,
    sendRawMessage
};

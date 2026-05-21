# ==========================================
# 1. Base Stage: Use official slim Node LTS base image
# ==========================================
FROM node:20-slim AS base

# Set working directory inside container
WORKDIR /app

# ==========================================
# 2. Dependencies: Install Puppeteer shared library dependencies
# ==========================================
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    xdg-utils \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# 3. Code & Dependencies Installation
# ==========================================
# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install packages (including downloading headless chrome for Puppeteer)
RUN npm ci --only=production

# Copy application source code files
COPY . .

# Create the scratch directory for temporary FFmpeg transcode operations
RUN mkdir -p scratch && chmod 777 scratch

# ==========================================
# 4. Environment and Execution Configurations
# ==========================================
# Expose default HTTP Port used by the official Express Webhook API mode
EXPOSE 3000

# Default environment configuration
ENV NODE_ENV=production \
    PORT=3000 \
    BOT_MODE=web-automation

# Boot the Sticker Bot entrypoint
CMD [ "npm", "start" ]

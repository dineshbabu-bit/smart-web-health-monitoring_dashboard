# Production Dockerfile for Smart Web Health Monitoring Backend
# Includes Google Chrome / Chromium runtime required for Lighthouse audits

FROM node:22-bookworm-slim

# Install latest Chromium and required dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome executable environment variable for chrome-launcher & lighthouse
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

# Copy dependency manifests and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/

# Expose default port (overridden by $PORT on Render, Railway, etc.)
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]


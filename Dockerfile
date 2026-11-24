FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    CLIPRD_DATA_DIR=/var/data \
    CLIPRD_PYTHON=/opt/venv/bin/python \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg python3 python3-venv python3-pip ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

RUN python3 -m venv /opt/venv
COPY requirements-live.txt ./
RUN /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements-live.txt yt-dlp

COPY . .
RUN mkdir -p /var/data/clips /var/data/downloads /var/data/thumbs /var/data/live-recordings \
    && chown -R node:node /app /var/data
USER node

EXPOSE 3847
CMD ["npm","start"]

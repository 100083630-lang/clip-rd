FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates python3 python3-pip curl && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages --no-cache-dir -U yt-dlp
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]

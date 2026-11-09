FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 && rm -rf /var/lib/apt/lists/*
RUN curl -L --fail --retry 3 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod 755 /usr/local/bin/yt-dlp && python3 /usr/local/bin/yt-dlp --version
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]

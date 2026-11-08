FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates python3 python3-pip curl unzip && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp
RUN curl -fsSL https://deno.land/install.sh | sh && cp /root/.deno/bin/deno /usr/local/bin/deno && deno --version
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev || npm install
COPY server.mjs ./
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]

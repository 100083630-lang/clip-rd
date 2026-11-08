async function downloadWithYtDlp(url, destination) {
  const base = [
    "--no-playlist",
    "--js-runtimes", "node:deno",
    "--extractor-args", "youtube:player_client=android,ios",
    "--extractor-args", "youtube:player_skip=webpage",
    "--no-check-certificates",
    "--geo-bypass",
    "--user-agent", "com.google.android.youtube/19.09.37 (Linux; U; Android 13; en_US)",
    "-f", "bv*[height<=720]+ba/b[height<=720]/b",
    "--remux-video", "mp4",
    "--recode-video", "mp4",
    "-o", destination,
    url
  ];
  try {
    await run("yt-dlp", base);
    return;
  } catch (e1) {
    console.log("yt-dlp android failed, trying web client:", String(e1).slice(0, 400));
  }
  // Intento 2: cliente web con impersonate
  await run("yt-dlp", ["--no-playlist", "--js-runtimes", "node:deno", "--impersonate", "chrome", "-f", "mp4/best", "-o", destination, url]);
}

import express from "express";

const app = express();

const base = "http://94.156.59.233:8899/udp/239.10.2.";
const port = ":30000";

const start = 150;
const end = 200;

let working = [];
let scanning = false;

// швидка перевірка (без зависання)
async function check(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, { signal: controller.signal });

    clearTimeout(timeout);

    return res.ok;
  } catch {
    return false;
  }
}

// 🟢 НЕ блокує відповідь
app.get("/scan", (req, res) => {
  if (scanning) {
    return res.json({ status: "already_scanning" });
  }

  scanning = true;
  working = [];

  res.json({ status: "started" });

  // 👉 фонова перевірка (НЕ блокує браузер)
  (async () => {
    for (let i = start; i <= end; i++) {
      const url = `${base}${i}${port}`;

      const ok = await check(url);

      if (ok) {
        working.push(url);
      }
    }

    scanning = false;
    console.log("SCAN DONE:", working.length);
  })();
});

// 🟢 швидкий плейлист
app.get("/playlist", (req, res) => {
  let m3u = "#EXTM3U\n\n";

  working.forEach((url, i) => {
    m3u += `#EXTINF:-1,Channel ${i + 1}\n${url}\n\n`;
  });

  res.setHeader("Content-Type", "application/x-mpegURL");
  res.send(m3u);
});

app.listen(process.env.PORT || 3000);

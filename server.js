import express from "express";
import fetch from "node-fetch";

const app = express();

const base = "http://94.156.59.233:8899/udp/239.10.2.";
const port = ":30000";

const start = 150;
const end = 200;

// кеш
let working = [];
let lastScan = 0;

// швидка перевірка
async function check(url) {
  try {
    const res = await fetch(url, { timeout: 4000 });
    if (!res.ok || !res.body) return false;

    const reader = res.body.getReader();
    const { value } = await reader.read();

    return value && value.length > 1500;
  } catch {
    return false;
  }
}

// 🔵 СКАНЕР (оновлює кеш)
app.get("/scan", async (req, res) => {
  const now = Date.now();

  // щоб не сканило кожен раз
  if (now - lastScan < 60000) {
    return res.send({
      status: "cached",
      count: working.length
    });
  }

  const newList = [];

  for (let i = start; i <= end; i++) {
    const url = `${base}${i}${port}`;

    const ok = await check(url);

    if (ok) {
      newList.push(url);
    }
  }

  working = newList;
  lastScan = now;

  res.send({
    status: "updated",
    count: working.length
  });
});

// 🟢 ПЛЕЙЛИСТ (тільки живі)
app.get("/playlist", (req, res) => {
  let m3u = "#EXTM3U\n\n";

  const list = working.length ? working : [];

  list.forEach((url, i) => {
    m3u += `#EXTINF:-1,Channel ${i + 1}\n${url}\n\n`;
  });

  res.setHeader("Content-Type", "application/x-mpegURL");
  res.send(m3u);
});

app.listen(process.env.PORT || 3000);

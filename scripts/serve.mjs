/**
 * Eenvoudige plaaslike webbediener om die werf op jou rekenaar te toets.
 * Hardloop met:  npm run dev
 * Maak dan oop:  http://localhost:3000  (of die poort wat hieronder gewys word)
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../public");
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
};

async function handler(req, res) {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/index.html";

    let filePath = path.join(PUBLIC, urlPath);
    // Beveiliging: bly binne die public-gids
    if (!filePath.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end("Verbode");
    }

    // As die pad 'n gids is, probeer index.html
    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = path.join(filePath, "index.html");
    } catch {
      // As lêer nie bestaan nie en geen ekstensie het nie, probeer .html
      if (!path.extname(filePath)) filePath += ".html";
    }

    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 - Bladsy nie gevind nie</h1>");
  }
}

// Probeer 'n poort; as dit reeds gebruik word, spring outomaties na die volgende.
// Elke poging kry 'n vars bediener sodat daar geen ou luisteraars oorbly nie.
function start(port, attemptsLeft) {
  const server = createServer(handler);
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`⚠️  Poort ${port} is reeds in gebruik — probeer ${port + 1}…`);
      start(port + 1, attemptsLeft - 1);
    } else if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ Kon geen vrye poort kry nie.\n` +
          `   Die werf loop dalk reeds — maak http://localhost:${PORT} in jou blaaier oop,\n` +
          `   of maak die ander terminal-venster toe en probeer weer.\n`
      );
      process.exit(1);
    } else {
      throw err;
    }
  });
  server.listen(port, () => {
    console.log(`\n✨ Werf loop op:  http://localhost:${port}`);
    console.log(`   (Druk Ctrl+C om te stop)\n`);
  });
}

start(PORT, 10);

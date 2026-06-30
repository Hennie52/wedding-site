/**
 * Optimaliseer die troue-foto's vir die web.
 *
 * Lees die groot oorspronklike foto's, verklein hulle en stoor klein,
 * vinnige weergawes (WebP + JPG) in public/assets/images.
 *
 * Hardloop met:  npm run optimize-images
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Waar die oorspronklike (gekose) foto's lê. Verander gerus hierdie pad.
const SRC_CANDIDATES = [
  path.resolve(ROOT, "../Images/Wesbite Images"),
  path.resolve(ROOT, "images-src"),
];
const OUT_DIR = path.resolve(ROOT, "public/assets/images");

// Groottes wat ons genereer
const SIZES = {
  full: { width: 2000, quality: 80 }, // groot weergawe (hero, lightbox)
  thumb: { width: 800, quality: 78 }, // klein weergawe (galery-rooster)
};

function findSrcDir() {
  for (const c of SRC_CANDIDATES) {
    if (existsSync(c)) return c;
  }
  return null;
}

async function main() {
  const srcDir = findSrcDir();
  if (!srcDir) {
    console.error("❌ Kon nie die foto-gids kry nie. Sit foto's in een van:");
    SRC_CANDIDATES.forEach((c) => console.error("   - " + c));
    process.exit(1);
  }
  console.log("📂 Bron-foto's:", srcDir);

  await mkdir(OUT_DIR, { recursive: true });

  const entries = (await readdir(srcDir))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (entries.length === 0) {
    console.error("❌ Geen foto's gevind in " + srcDir);
    process.exit(1);
  }

  const manifest = [];
  let i = 0;
  for (const file of entries) {
    i++;
    const id = `foto-${String(i).padStart(2, "0")}`;
    const srcPath = path.join(srcDir, file);
    const meta = await sharp(srcPath).metadata();

    const variants = {};
    for (const [sizeName, cfg] of Object.entries(SIZES)) {
      const base = sharp(srcPath).rotate().resize({
        width: cfg.width,
        withoutEnlargement: true,
      });

      const webpName = `${id}-${sizeName}.webp`;
      const jpgName = `${id}-${sizeName}.jpg`;
      await base
        .clone()
        .webp({ quality: cfg.quality })
        .toFile(path.join(OUT_DIR, webpName));
      await base
        .clone()
        .jpeg({ quality: cfg.quality, mozjpeg: true })
        .toFile(path.join(OUT_DIR, jpgName));

      variants[sizeName] = { webp: webpName, jpg: jpgName };
    }

    const outStat = await stat(path.join(OUT_DIR, variants.full.webp));
    manifest.push({
      id,
      original: file,
      width: meta.width,
      height: meta.height,
      orientation: meta.width >= meta.height ? "landscape" : "portrait",
      ...variants,
    });
    console.log(
      `✅ ${file}  →  ${id}  (${(outStat.size / 1024).toFixed(0)} KB webp)`
    );
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\n🎉 Klaar! ${manifest.length} foto's geoptimaliseer.`);
  console.log("   Manifest:", path.join(OUT_DIR, "manifest.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

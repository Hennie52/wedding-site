/**
 * Optimaliseer die ontwerp se benoemde foto's (assets/foto/*.jpg) vir die web.
 * Maak WebP + JPG, vol-grootte + galery-duimnael, en 'n galery-manifest.
 *
 * Hardloop met:  node scripts/optimize-design-images.mjs
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SRC = path.resolve(
  ROOT,
  "design-import/eucalyptus-wedding-portal/project/assets/foto"
);
const OUT = path.resolve(ROOT, "public/assets/foto");

// Galery-volgorde soos in die ontwerp (Galery.dc.html)
const GALLERY_ORDER = [
  { file: "ring.jpg", alt: "Hennie en Jolinda, die ring" },
  { file: "wandel.jpg", alt: "Die gesin stap saam" },
  { file: "seun.jpg", alt: "Ons seun in die veld" },
  { file: "opgooi.jpg", alt: "Pa gooi seun in die lug" },
  { file: "familie.jpg", alt: "Gesinsportret" },
  { file: "ma-seun.jpg", alt: "Ma en seun" },
  { file: "familie-sw.jpg", alt: "Gesin in swart en wit" },
  { file: "ma-seun2.jpg", alt: "Ma en seun, hand aan hand" },
];

async function main() {
  if (!existsSync(SRC)) {
    console.error("❌ Kon nie die ontwerp se foto's kry nie:", SRC);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });

  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const file of files) {
    const stem = file.replace(/\.[^.]+$/, "");
    const src = path.join(SRC, file);
    // Vol-grootte (hero, storie, lightbox)
    await sharp(src).rotate().resize({ width: 1700, withoutEnlargement: true })
      .webp({ quality: 82 }).toFile(path.join(OUT, `${stem}.webp`));
    await sharp(src).rotate().resize({ width: 1700, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${stem}.jpg`));
    // Galery-duimnael
    await sharp(src).rotate().resize({ width: 820, withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(path.join(OUT, `${stem}-thumb.webp`));
    console.log(`✅ ${file}`);
  }

  // Galery-manifest (net die foto's wat bestaan, in die regte volgorde)
  const gallery = GALLERY_ORDER.filter((g) => files.includes(g.file)).map((g) => {
    const stem = g.file.replace(/\.[^.]+$/, "");
    return { stem, alt: g.alt, thumb: `${stem}-thumb.webp`, full: `${stem}.webp`, jpg: `${stem}.jpg` };
  });
  await writeFile(path.join(OUT, "gallery.json"), JSON.stringify(gallery, null, 2));
  console.log(`\n🎉 Klaar! ${files.length} foto's. Galery: ${gallery.length} items.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

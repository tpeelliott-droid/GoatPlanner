import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public/icons/goat-mark.svg");
const outDir = path.join(root, "public/icons");

mkdirSync(outDir, { recursive: true });

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));

  // maskable version with padding so the mark survives circular/rounded crops
  const padded = Math.round(size * 0.7);
  const pad = Math.round((size - padded) / 2);
  const bg = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#FFC531",
    },
  })
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([
      {
        input: await sharp(src, { density: 384 }).resize(padded, padded).png().toBuffer(),
        top: pad,
        left: pad,
      },
    ])
    .png()
    .toFile(path.join(outDir, `icon-maskable-${size}.png`));
}

await sharp(src, { density: 384 }).resize(180, 180).png().toFile(path.join(outDir, "apple-touch-icon.png"));
await sharp(src, { density: 384 }).resize(32, 32).png().toFile(path.join(outDir, "favicon-32.png"));
await sharp(src, { density: 384 }).resize(16, 16).png().toFile(path.join(outDir, "favicon-16.png"));

console.log("Icons generated.");

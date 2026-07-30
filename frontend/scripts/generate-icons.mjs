import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const BG = "#059669"; // emerald-600, matches the app accent color

function svg({ size, fullBleed }) {
  const cx = size * 0.5;
  const cy = size * 0.48;
  const moonR = size * 0.3;
  const cutR = size * 0.25;
  const cutOffsetX = size * 0.11;
  const cutOffsetY = size * 0.022;

  const bg = fullBleed
    ? `<rect width="${size}" height="${size}" fill="${BG}"/>`
    : `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BG}"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <mask id="cut">
    <rect width="${size}" height="${size}" fill="white"/>
    <circle cx="${cx + cutOffsetX}" cy="${cy - cutOffsetY}" r="${cutR}" fill="black"/>
  </mask>
  <circle cx="${cx}" cy="${cy}" r="${moonR}" fill="white" mask="url(#cut)"/>
</svg>`;
}

const targets = [
  { size: 192, name: "icon-192.png", fullBleed: false },
  { size: 512, name: "icon-512.png", fullBleed: false },
  { size: 192, name: "icon-192-maskable.png", fullBleed: true },
  { size: 512, name: "icon-512-maskable.png", fullBleed: true },
];

for (const target of targets) {
  const buffer = Buffer.from(svg(target));
  const outPath = path.join(OUT_DIR, target.name);
  await sharp(buffer).png().toFile(outPath);
  console.log("wrote", target.name);
}

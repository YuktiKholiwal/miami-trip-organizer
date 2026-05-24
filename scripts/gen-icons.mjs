import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7E5F"/>
      <stop offset="1" stop-color="#FF3D8A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="220" r="86" fill="#FFE9DA" opacity="0.95"/>
  <g stroke="#2B1437" stroke-width="14" stroke-linecap="round" fill="none">
    <path d="M256 360 Q 250 280 230 220"/>
    <path d="M230 220 Q 180 180 130 200"/>
    <path d="M230 220 Q 200 160 160 140"/>
    <path d="M230 220 Q 260 150 320 150"/>
    <path d="M230 220 Q 290 180 340 200"/>
  </g>
  <rect x="120" y="360" width="272" height="20" rx="10" fill="#FFE9DA" opacity="0.6"/>
  <rect x="80" y="395" width="352" height="14" rx="7" fill="#FFE9DA" opacity="0.4"/>
</svg>`;

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7E5F"/>
      <stop offset="1" stop-color="#FF3D8A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(128 128) scale(0.5)">
    <circle cx="256" cy="220" r="86" fill="#FFE9DA"/>
    <g stroke="#2B1437" stroke-width="14" stroke-linecap="round" fill="none">
      <path d="M256 360 Q 250 280 230 220"/>
      <path d="M230 220 Q 180 180 130 200"/>
      <path d="M230 220 Q 200 160 160 140"/>
      <path d="M230 220 Q 260 150 320 150"/>
      <path d="M230 220 Q 290 180 340 200"/>
    </g>
  </g>
</svg>`;

const out = path.resolve("public");
fs.mkdirSync(out, { recursive: true });

await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(out, "icon-192.png"));
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(out, "icon-512.png"));
await sharp(Buffer.from(svgMaskable)).resize(512, 512).png().toFile(path.join(out, "icon-512-maskable.png"));
await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(path.join(out, "apple-touch-icon.png"));
fs.writeFileSync(path.join(out, "favicon.svg"), svg);

console.log("Icons generated:", fs.readdirSync(out).filter((f) => f.startsWith("icon") || f === "favicon.svg" || f === "apple-touch-icon.png"));

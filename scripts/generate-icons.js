// Script para gerar ícones PWA
// Uso: node generate-icons.js
// Requer: node (sem dependências extras - gera PNG mínimo)

const fs = require("fs");
const path = require("path");

function createPNG(size) {
  // Cria um PNG mínimo de 1 pixel na cor #0033A0 (azul do bolão)
  // Para ícones reais, substitua por imagens personalizadas

  // Minimal valid PNG (1x1 pixel blue)
  const PNG_1x1_BLUE_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // We'll just write a placeholder - users should replace with real icons
  return Buffer.from(PNG_1x1_BLUE_BASE64, "base64");
}

const outDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

[192, 512].forEach((size) => {
  // Generate a simple SVG-based description file
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0033A0"/>
  <text x="50%" y="55%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.45}"
    fill="#FFD700">B26</text>
  <text x="50%" y="${size * 0.78}" dominant-baseline="central" text-anchor="middle"
    font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.12}"
    fill="#F0F4FF">COPA 2026</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${size}.svg`), svg);

  // Create a minimal PNG placeholder
  // Note: For real deployment, convert SVGs to PNGs using a tool
  const pngData = createPNG(size);
  fs.writeFileSync(path.join(outDir, `${size}.png`), pngData);

  console.log(`Generated ${size}x${size} icon (placeholder PNG + SVG)`);
});

console.log("\n\u2705 Icons generated in public/icons/");
console.log("Para \u00edcones reais, converta os SVGs para PNG em:");
console.log("  - https://iconifier.net");
console.log("  - Ou use: npx sharp-cli convert public/icons/192.svg public/icons/192.png");

// Node.js utility script — run with: node scripts/generate-icons.js
// Intentionally uses CommonJS require (not ESM) so it runs without a build step.
/* eslint-disable */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src512 = path.join(__dirname, '../public/icon-512.png');
const publicDir = path.join(__dirname, '../public');

async function resize(input, output, size) {
  const tmp = output.replace('.png', '_tmp.jpg');
  await sharp(input)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 100 })
    .toFile(tmp);
  await sharp(tmp).png().toFile(output);
  fs.unlinkSync(tmp);
  console.log(`✓ ${path.basename(output)} (${size}x${size})`);
}

async function main() {
  await resize(src512, path.join(publicDir, 'icon-192.png'), 192);
  await resize(src512, path.join(publicDir, 'apple-touch-icon.png'), 180);
  await resize(src512, path.join(publicDir, 'favicon-32x32.png'), 32);
  await resize(src512, path.join(publicDir, 'favicon-16x16.png'), 16);
  fs.copyFileSync(src512, path.join(publicDir, 'logo.png'));
  console.log('✓ logo.png');
  console.log('\n✅ All icon sizes generated successfully!');
}

main().catch(console.error);

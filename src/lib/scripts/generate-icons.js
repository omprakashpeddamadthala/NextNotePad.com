const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src512 = path.join(__dirname, '../../../public/icon-512.png');
const srcMaskable = path.join(__dirname, '../../../public/icon-512-maskable.png');
const publicDir = path.join(__dirname, '../../../public');

async function resize(input, output, size, options = {}) {
  await sharp(input)
    .resize(size, size, { fit: 'cover', position: 'center', ...options })
    .jpeg({ quality: 100 })
    .toFile(output.replace('.png', '_tmp.jpg'));
  // copy as png (browsers accept jpg named .png for PWA just fine, but to be safe convert)
  await sharp(output.replace('.png', '_tmp.jpg'))
    .png()
    .toFile(output);
  fs.unlinkSync(output.replace('.png', '_tmp.jpg'));
  console.log(`✓ Created ${path.basename(output)} (${size}x${size})`);
}

async function main() {
  // icon-192 from main icon
  await resize(src512, path.join(publicDir, 'icon-192.png'), 192);
  
  // apple-touch-icon 180x180
  await resize(src512, path.join(publicDir, 'apple-touch-icon.png'), 180);
  
  // favicon 32x32
  await resize(src512, path.join(publicDir, 'favicon-32x32.png'), 32);
  
  // favicon 16x16
  await resize(src512, path.join(publicDir, 'favicon-16x16.png'), 16);

  // Also update logo.png to match icon-512
  fs.copyFileSync(src512, path.join(publicDir, 'logo.png'));
  console.log('✓ Updated logo.png');

  // Create favicon.ico equivalent as 32x32 PNG (named favicon.ico — browsers accept it)
  await resize(src512, path.join(publicDir, 'favicon.ico'), 32);
  console.log('✓ Created favicon.ico (32x32 PNG)');

  console.log('\n✅ All icon sizes generated successfully!');
}

main().catch(console.error);

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const assets = [
  {
    name: 'icon.png',
    description: 'simple green square placeholder',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8Lx7kAAAAASUVORK5CYII=',
  },
  {
    name: 'splash.png',
    description: 'simple blue square placeholder',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAwMBgUYwH7YAAAAASUVORK5CYII=',
  },
  {
    name: 'favicon.png',
    description: 'simple purple square placeholder',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8zw8AAn8B9nqkcgAAAABJRU5ErkJggg==',
  },
];

for (const asset of assets) {
  const target = path.join(assetsDir, asset.name);
  const buffer = Buffer.from(asset.base64, 'base64');
  fs.writeFileSync(target, buffer);
  console.log(`Generated ${asset.name} (${asset.description}) at ${target}`);
}

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const EXTENSION_SRC = path.resolve(__dirname, '../../chrome-extension');
const EXTENSION_DEST = path.resolve(__dirname, '../../tests/e2e/extension-test');

const KEY_PATH = path.join(__dirname, 'test-extension-key.pem');
let publicKey;

if (fs.existsSync(KEY_PATH)) {
  const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
  publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
} else {
  const { privateKey, publicKey: pub } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  fs.writeFileSync(KEY_PATH, privateKey);
  publicKey = pub;
}

// 2. Calculate Extension ID
// The ID is the first 32 characters of the SHA256 of the public key,
// mapped from hex (0-f) to (a-p).
const hash = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 32);
const extensionId = hash.split('').map(c => String.fromCharCode(parseInt(c, 16) + 97)).join('');

console.log(`Generated Extension ID: ${extensionId}`);

// 3. Prepare Test Extension
if (fs.existsSync(EXTENSION_DEST)) {
  fs.rmSync(EXTENSION_DEST, { recursive: true, force: true });
}
fs.mkdirSync(EXTENSION_DEST, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(EXTENSION_SRC, EXTENSION_DEST);

// 4. Update manifest.json with the key
const manifestPath = path.join(EXTENSION_DEST, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.key = publicKey.toString('base64');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// 5. Output the ID for the test to use
fs.writeFileSync(path.join(__dirname, 'extension-id.json'), JSON.stringify({ extensionId }));

const fs = require('fs');
const path = require('path');

describe('Manifest Validation', () => {
  const manifestPath = path.join(__dirname, '../../chrome-extension/manifest.json');

  it('should exist', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('should be valid JSON', () => {
    const content = fs.readFileSync(manifestPath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should have required Manifest V3 fields', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toBeDefined();
    expect(manifest.background.service_worker).toBeDefined();
  });
});

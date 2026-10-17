import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const VIRTUAL_ID = 'virtual:asset-files';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function listFiles(dir, base) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (!entry.name.startsWith('.')) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

// Lists the files that really exist in public/assets, so BootScene only
// requests those. Missing assets then cause no 404s and no console errors.
// Restart the dev server after adding new asset files.
function assetFilesPlugin() {
  return {
    name: 'unheard-asset-files',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const pub = path.resolve('public');
      const files = listFiles(path.join(pub, 'assets'), pub);
      return 'export default ' + JSON.stringify(files) + ';';
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [assetFilesPlugin()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});

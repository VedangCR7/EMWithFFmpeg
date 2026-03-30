const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

const entryFiles = [
  path.join(PROJECT_ROOT, 'App.tsx'),
  path.join(PROJECT_ROOT, 'index.js'),
];

const files = [];

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(name) && !name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
};

walk(SRC_DIR);

const references = new Set();

const resolveModulePath = (absPath) => {
  const candidates = [
    absPath,
    `${absPath}.ts`,
    `${absPath}.tsx`,
    `${absPath}.js`,
    `${absPath}.jsx`,
    path.join(absPath, 'index.ts'),
    path.join(absPath, 'index.tsx'),
    path.join(absPath, 'index.js'),
    path.join(absPath, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.relative(SRC_DIR, candidate).replace(/\\/g, '/');
    }
  }

  return path.relative(SRC_DIR, absPath).replace(/\\/g, '/');
};

const addReference = (fromDir, mod) => {
  if (!mod.startsWith('.')) return;

  const absPath = path.resolve(fromDir, mod);
  const resolved = resolveModulePath(absPath);
  references.add(resolved.replace(/\.(tsx?|jsx?)$/, ''));
};

const recordReferences = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const dir = path.dirname(filePath);
  const code = fs.readFileSync(filePath, 'utf8');

  const importRegex = /import[^'"\n]*['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

  let match;

  while ((match = importRegex.exec(code))) {
    addReference(dir, match[1]);
  }

  while ((match = requireRegex.exec(code))) {
    addReference(dir, match[1]);
  }
};

for (const file of files) {
  recordReferences(file);
}

for (const entryFile of entryFiles) {
  recordReferences(entryFile);
}

const unused = [];

for (const file of files) {
  const rel = path.relative(SRC_DIR, file).replace(/\\/g, '/');

  const key = rel.replace(/\.(tsx?|jsx?)$/, '');
  if (!references.has(key)) {
    unused.push(rel);
  }
}

console.log(`Unused files: ${unused.length}`);
for (const file of unused.sort()) {
  console.log(file);
}

if (!references.has('utils/responsiveUtils')) {
  console.warn('Note: responsiveUtils.ts is reported unused by the script. Verify manually.');
}


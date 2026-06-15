// Adds explicit subpath exports to @modelcontextprotocol/sdk so that Node.js CJS
// require() can resolve them without relying on the wildcard "./*" pattern, which
// fails via finalizeEsmResolution on Linux (Node 20 and 22).
const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve('node_modules/@modelcontextprotocol/sdk/package.json');

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const subpaths = [
  'server/mcp',
  'server/streamableHttp',
  'client/index',
  'inMemory',
];

for (const subpath of subpaths) {
  const key = `./${subpath}`;
  pkg.exports[key] = {
    types: `./dist/esm/${subpath}.d.ts`,
    import: `./dist/esm/${subpath}.js`,
    require: `./dist/cjs/${subpath}.js`,
  };
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Patched @modelcontextprotocol/sdk exports');

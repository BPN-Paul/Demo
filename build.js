const fs = require('fs');
const t = fs.readFileSync('src/index.template.html', 'utf8');
const out = t.replace('/*CSS*/', () => fs.readFileSync('src/style.css', 'utf8'))
  .replace('/*PDF*/', () => fs.readFileSync('src/pdf.js', 'utf8'))
  .replace('/*DOCS*/', () => fs.readFileSync('src/docs.js', 'utf8'))
  .replace('/*DEMO*/', () => fs.readFileSync('src/demo.js', 'utf8'))
  .replace('/*APP*/', () => fs.readFileSync('src/app.js', 'utf8'));
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', out);
console.log('ok', out.length, 'bytes');

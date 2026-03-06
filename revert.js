const fs = require('fs');
let css = fs.readFileSync('public/styles.css', 'utf8');

css = css.replace(/--body-bg: #090e17;[\s\S]*?--bg-pattern-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;/g, '--body-bg: radial-gradient(circle at top, #1c2436, #0d1016);');
css = css.replace(/--body-bg: #eaf1f8;[\s\S]*?--bg-pattern-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;/g, '--body-bg: radial-gradient(circle at top, #dbeafe, #f0f4f8);');

css = css.replace(/background-color: var\(--body-bg\);\n  background-image: var\(--bg-pattern\);\n  background-size: var\(--bg-pattern-size\);\n  background-position: center top;/, 'background: var(--body-bg);');

fs.writeFileSync('public/styles.css', css, 'utf8');
console.log('Reverted medical background');

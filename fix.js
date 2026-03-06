const fs = require('fs');
const files = ['public/index.html', 'public/styles.css', 'public/app.js'];

const map = {
  'ðŸŒ™': '🌙',
  'â˜€ï¸': '☀️',
  'ðŸ“‚': '📁',
  'â–¶': '▶',
  'â–¶ Start Demo': '▶ Start Demo',
  'â¤ï¸': '❤️',
  'ðŸ©¸': '🩸',
  'ðŸŒ¡ï¸': '🌡️',
  'ðŸ””': '🔔',
  'ðŸ“Š Overview': '📊 Overview',
  'ðŸ“Š': '📊',
  'ðŸ“ˆ': '📈',
  'ðŸ§\xa0': '🧠',
  '&#9654;': '▶',
  'âš\xa0ï¸': '⚠️',
  'â†': '←',
  'â†’': '→',
  'ðŸš¨': '🚨',
  'âœ•': '✖',
  'ðŸ¤–': '🤖',
  'âœ–': '✖',
  '&mdash;': '—',
  'Iâ€™m': 'I’m',
  'patientâ€™s': 'patient’s',
  'â€”:': '—',
  'â€”': '—',
  'âš ï¸': '⚠️',
  'âš ': '⚠️'
};

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  for (const [bad, good] of Object.entries(map)) {
    content = content.split(bad).join(good);
  }
  fs.writeFileSync(file, content, 'utf8');
}
console.log('Mojibake fixed');

const fs = require('fs');
let text = fs.readFileSync('e:/hi suvai/index.html', 'utf8');
text = text.replace(/â€”/g, '-');
text = text.replace(/\?"/g, '-');
text = text.replace(/\?"/g, '-');
text = text.replace(/\?"/g, '-');
// Let's just do a simpler replace based on the surrounding text:
text = text.replace(/phone [^ ]+ we are/g, 'phone - we are');
text = text.replace(/flavours [^ ]+ just roasted/g, 'flavours - just roasted');
text = text.replace(/fresh [^ ]+ completely different/g, 'fresh - completely different');
fs.writeFileSync('e:/hi suvai/index.html', text);
console.log('Fixed encodings.');

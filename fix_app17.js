const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/div><\/div>\) : \(/g, '</div></div>) : (');
// Actually, let me just see if I can run prettier to find the exact syntax error.

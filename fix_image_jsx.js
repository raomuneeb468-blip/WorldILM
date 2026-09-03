import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/div><\/div><\/div>\) : \(\s*\/\/\s*Shimmer Box during Image Creation/g, '</div></div>) : (\n                                  // Shimmer Box during Image Creation');

fs.writeFileSync('src/App.tsx', content);

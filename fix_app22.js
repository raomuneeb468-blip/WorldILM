import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = '{m.content}</div></div>) : (';
if (content.includes(target)) {
  console.log("Found!");
  content = content.replace(target, '{m.content}\n</div>\n</div>\n) : (');
} else {
  console.log("NOT FOUND! Trying another method...");
  // Let's replace any instance of </div></div>) : (
  content = content.replace(/<\/div><\/div>\) : \(/g, '</div>\n</div>\n) : (');
}

fs.writeFileSync('src/App.tsx', content);

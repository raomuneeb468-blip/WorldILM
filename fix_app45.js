import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: LogoContainer
// Find <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center"> inside LogoContainer
// and replace it with nothing since I already added <motion.div> in logoReplacement
content = content.replace(/return \(\s*<div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">/g, 'return (');

// Wait! Maybe I should just reset LogoContainer.
// To reset it:
content = content.replace(/<motion\.div\s*animate=\{isThinking \? \{ scale: \[1, 1\.15, 1\] \} : \{ scale: 1 \}\}\s*transition=\{\{ repeat: Infinity, duration: 1\.5, ease: "easeInOut" \}\}\s*className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center"\s*>\s*<div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">/g, 
`<motion.div
      animate={isThinking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center"
    >`);


// Fix 2: Fragment mismatch
// Looking at: </div></div></>)}</div>) : (
// It says "Unexpected closing div tag does not match opening fragment tag".
// So there's a </div> before </>.
// Let's replace </div></div></>)}</div>) : ( with </div></>)}</div></div>) : (
content = content.replace(/<\/div><\/div>\n                          <\/>\n                          \)}<\/div>\) : \(/g, '\n                          </>\n                          )}</div></div>) : (');


fs.writeFileSync('src/App.tsx', content);

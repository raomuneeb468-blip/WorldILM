import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll manually search and replace the block for Reactions in Assistant Message
const match1 = content.indexOf('{/* Reaction Picker for Image result */}');
if (match1 !== -1) {
  const nextDiv = content.indexOf('</div>', match1);
  const endDiv = content.indexOf('</div>', nextDiv + 6);
  const endDiv3 = content.indexOf('</div>', endDiv + 6);
  // Just rip out the whole Reaction Picker for Image result
  const blockEnd = content.indexOf(') : (', match1);
  if (blockEnd !== -1) {
    // Actually wait, we just want to remove the reaction picker div and its contents.
    // It is a <div className="flex items-center gap-1.5 select-none relative">
    content = content.replace(/\{\/\* Reaction Picker for Image result \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\) : \(/, '</div></div></div>) : (');
  }
}

// Remove from MemoizedAssistantContent again just in case
content = content.replace(/\{\/\* Existing Reactions \*\/\}[\s\S]*?\{\/\* Picker Dropdown \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\) : \(/g, '</div></div></div>) : (');

// And remove any remaining REACTION_EMOJIS
content = content.replace(/const REACTION_EMOJIS = \["👍", "❤️", "😂", "😮", "😢", "🙏"\];\n/, '');

fs.writeFileSync('src/App.tsx', content);

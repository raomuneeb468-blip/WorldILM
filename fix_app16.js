import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const removeBetween = (startStr, endStr) => {
  const start = content.indexOf(startStr);
  if (start !== -1) {
    const end = content.indexOf(endStr, start);
    if (end !== -1) {
      content = content.substring(0, start) + content.substring(end + endStr.length);
    }
  }
}

removeBetween('const handleAddReaction = async', '  };\n');
removeBetween('const activeReactions = reactions', '[]\n');
removeBetween('{/* Emoji Reactions INCLUDED inside AI written content */}', '      )}');
removeBetween('const prevReactions =', 'return false;\n  }\n');
removeBetween('{/* Emoji Reaction Button */}', ')}');

fs.writeFileSync('src/App.tsx', content);

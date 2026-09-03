import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '  reactions?: Record<string, number>;\n}',
  '  reactions?: Record<string, number>;\n  onAddReaction: (emoji: string) => void;\n}'
);

content = content.replace(
  '  fontSizeClass,\n  reactions\n}: MemoizedAssistantContentProps) => {',
  '  fontSizeClass,\n  reactions,\n  onAddReaction\n}: MemoizedAssistantContentProps) => {'
);

content = content.replace(
  '                                reactions={m.reactions}\n                              />',
  '                                reactions={m.reactions}\n                                onAddReaction={(e) => handleAddReaction(m.id, e)}\n                              />'
);

content = content.replace(
  'const App = () => {',
  'const REACTION_EMOJIS = ["👍", "👎", "🔥", "🎉", "💡", "❤️"];\n\nconst App = () => {'
);

fs.writeFileSync('src/App.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '  compiledDoc?: any;\n}',
  '  compiledDoc?: any;\n  reactions?: Record<string, number>;\n}'
);

content = content.replace(
  '  fontSizeClass: string;\n}',
  '  fontSizeClass: string;\n  reactions?: Record<string, number>;\n}'
);

content = content.replace(
  '  fontSizeClass\n}: MemoizedAssistantContentProps) => {',
  '  fontSizeClass,\n  reactions\n}: MemoizedAssistantContentProps) => {'
);

content = content.replace(
  '                                onShowToast={showToast}\n                                fontFamilyClass={getFontFamilyClass(chatFontFamily)}\n                                fontSizeClass={getFontSizeClass(chatFontSize)}\n                              />',
  '                                onShowToast={showToast}\n                                fontFamilyClass={getFontFamilyClass(chatFontFamily)}\n                                fontSizeClass={getFontSizeClass(chatFontSize)}\n                                reactions={m.reactions}\n                              />'
);

fs.writeFileSync('src/App.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const copyEditButtons = `
  <div className="absolute -bottom-6 right-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button onClick={() => { navigator.clipboard.writeText(m.content); showToast("Copied to clipboard"); }} className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer" title="Copy">
      <Copy size={12} />
    </button>
    <button onClick={() => { setEditingMessageId(m.id); setEditMessageContent(m.content); }} className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer" title="Edit & Resend">
      <Edit2 size={12} />
    </button>
  </div>
`;

content = content.replace(/\{m\.content\}\n\s*<\/div>\n\s*<\/div><\/div><\/div>\) : \(/, '{m.content}\n' + copyEditButtons + '\n</div>\n</>\n)}</div></div>) : (');

fs.writeFileSync('src/App.tsx', content);

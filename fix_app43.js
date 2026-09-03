import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const userMsgStart = '{m.role === "user" ? (\n                        <div className="flex flex-col items-end gap-1 max-w-[85%] group">';
const userMsgReplacement = '{m.role === "user" ? (\n                        <div className="flex flex-col items-end gap-1 max-w-[85%] group">\n' +
`                          {editingMessageId === m.id ? (
                            <div className="w-full flex flex-col gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 shadow-sm min-w-[280px]">
                              <textarea
                                className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800"
                                value={editMessageContent}
                                onChange={(e) => setEditMessageContent(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditMessageSubmit(m.id);
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingMessageId(null)} className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 cursor-pointer">Cancel</button>
                                <button onClick={() => handleEditMessageSubmit(m.id)} className="bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Send</button>
                              </div>
                            </div>
                          ) : (
                            <>
`;
content = content.replace(userMsgStart, userMsgReplacement);

// Close the React fragment after the user message content.
const mContentEnd = '{m.content}\n' + 
`  <div className="absolute -bottom-6 right-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button onClick={() => { navigator.clipboard.writeText(m.content); showToast("Copied to clipboard"); }} className="text-zinc-400 hover:text-zinc-600 p-1" title="Copy">
      <Copy size={12} />
    </button>
    <button onClick={() => { setEditingMessageId(m.id); setEditMessageContent(m.content); }} className="text-zinc-400 hover:text-zinc-600 p-1" title="Edit & Resend">
      <Edit2 size={12} />
    </button>
  </div>
                          </div>
                          </div></div></div>) : (`;
const mContentEndReplacement = mContentEnd.replace('</div></div></div>) : (', '</div></div>\n                          </>\n                          )}</div>) : (');

content = content.replace(mContentEnd, mContentEndReplacement);

// Also remove emoji arrays safely
content = content.replace('const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];', 'const REACTION_EMOJIS: string[] = [];');

fs.writeFileSync('src/App.tsx', content);

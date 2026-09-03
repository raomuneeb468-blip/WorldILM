import fs from 'fs';
let content = fs.readFileSync('tmp.txt', 'utf8');

// First fix the JSX syntax errors I know about:
content = content.replace('{m.content}\n                          </div>\n                          </div></div>) : (', '{m.content}\n                          </div>\n                          </div></div></div>) : (');
content = content.replace('</button>\n                                      </div>\n                                      </div></div>) : (', '</button>\n                                      </div>\n                                      </div></div></div></div>) : (');

// Now, properly add copy and edit buttons for the user message.
// The user message is:
const userMsgTarget = '<div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">';
const userMsgReplacement = '<div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap relative group">';
content = content.replace(userMsgTarget, userMsgReplacement);

const copyEditButtons = `
  <div className="absolute -bottom-6 right-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button onClick={() => { navigator.clipboard.writeText(m.content); showToast("Copied to clipboard"); }} className="text-zinc-400 hover:text-zinc-600 p-1" title="Copy">
      <Copy size={12} />
    </button>
    <button onClick={() => { setEditingMessageId(m.id); setEditMessageContent(m.content); }} className="text-zinc-400 hover:text-zinc-600 p-1" title="Edit & Resend">
      <Edit2 size={12} />
    </button>
  </div>
`;

// Insert the buttons after {m.content} inside the user message.
const mContentTarget = '{m.content}\n                          </div>\n                          </div></div></div>) : (';
const mContentReplacement = '{m.content}\n' + copyEditButtons + '                          </div>\n                          </div></div></div>) : (';
content = content.replace(mContentTarget, mContentReplacement);

// We need to wrap the user message in the edit condition.
// First, state variables.
content = content.replace('const [activeSessionId, setActiveSessionId] = useState<string | null>(null);', 
  'const [activeSessionId, setActiveSessionId] = useState<string | null>(null);\n  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);\n  const [editMessageContent, setEditMessageContent] = useState("");');

// Next, handleEditMessageSubmit
const editHandler = `
  const handleEditMessageSubmit = async (messageId: string) => {
    if (isBusy) return;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;
    const newHistory = messages.slice(0, msgIndex);
    setMessages(newHistory);
    setEditingMessageId(null);
    setTimeout(() => {
      handleSendMessage(editMessageContent, undefined, newHistory);
    }, 50);
  };
  const handleSendMessage = async (customPrompt?: string, customRatio?: string, overrideHistory?: Message[]) => {
`;
content = content.replace('const handleSendMessage = async (customPrompt?: string, customRatio?: string) => {', editHandler);
// We also need to fix handleSendMessage signature in the `tmp.txt` where I changed it before.
content = content.replace('const handleSendMessage = async (customPrompt?: string, customRatio?: string, overrideHistory?: Message[]) => {', editHandler);

fs.writeFileSync('src/App.tsx', content);

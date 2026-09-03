import fs from 'fs';
let content = fs.readFileSync('tmp.txt', 'utf8');

// 1. Fix JSX structural errors in tmp.txt
content = content.replace('{m.content}\n                          </div>\n                          </div></div>) : (', '{m.content}\n                          </div>\n                          </div></div></div>) : (');
content = content.replace('</button>\n                                      </div>\n                                      </div></div>) : (', '</button>\n                                      </div>\n                                      </div></div></div></div>) : (');

// 2. Remove emojis from AI response safely
content = content.replace('const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];', 'const REACTION_EMOJIS: string[] = [];');

// 3. User message: add editing state and Copy/Edit buttons
content = content.replace('const [activeSessionId, setActiveSessionId] = useState<string | null>(null);', 
  'const [activeSessionId, setActiveSessionId] = useState<string | null>(null);\n  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);\n  const [editMessageContent, setEditMessageContent] = useState("");');

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
content = content.replace('const handleSendMessage = async (customPrompt?: string, customRatio?: string, overrideHistory?: Message[]) => {', editHandler);
content = content.replace('const handleSendMessage = async (customPrompt?: string, customRatio?: string) => {', editHandler);

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

const userMsgTarget = '<div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">';
const userMsgReplacement2 = '<div className="bg-zinc-100 text-zinc-800 px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed break-words whitespace-pre-wrap relative group">';
content = content.replace(userMsgTarget, userMsgReplacement2);

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
// </div></div></div>) : ( is what we replaced it with above.
// Before my fragment logic, it was:
// {m.content}
// </div>
// </div></div></div>) : (
// Wait, the first </div> closes `bg-zinc-100`. The second closes `flex items-center gap-1.5`? No!
// Let's just cleanly replace `{m.content}\n                          </div>\n                          </div></div></div>) : (`
// with `{m.content}\n {buttons} </div></>)}</div>) : (`
const mContentTarget = '{m.content}\n                          </div>\n                          </div></div></div>) : (';
const mContentReplacement = '{m.content}\n' + copyEditButtons + '                          </div>\n                          </>\n                          )}</div>) : (';
content = content.replace(mContentTarget, mContentReplacement);


// 4. Logo animations and Timer
const timerComponent = `
const Timer = ({ status }: { status: string }) => {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTime((t) => t + 0.1), 100);
    return () => clearInterval(int);
  }, []);
  return (
    <span className="flex items-center gap-2">
      <span>{status}</span>
      <span className="tabular-nums opacity-70 font-mono">{(time).toFixed(1)}s</span>
    </span>
  );
};
`;
content = content.replace('export default function App() {', timerComponent + '\nexport default function App() {');

const titleTarget = `<span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-sans leading-none">
                                Worldilm AI
                              </span>
                              {isBusy && idx === messages.length - 1 && (
                                <span className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest mt-1 animate-pulse">
                                  {m.content ? "Streaming Solutions" : "Composing response"}
                                </span>
                              )}`;
const titleReplacement = `<span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-sans leading-none">
                                Worldilm AI
                              </span>
                              {isBusy && idx === messages.length - 1 && (
                                <motion.span
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest mt-1"
                                >
                                  {m.content ? "Streaming Solutions..." : <Timer status="Generating Insights" />}
                                </motion.span>
                              )}`;
content = content.replace(titleTarget, titleReplacement);

// LogoContainer
content = content.replace(
  'const LogoContainer = ({ isThinking, isStreaming }: { isThinking: boolean; isStreaming: boolean }) => {\n  return (\n    <div className="relative flex items-center justify-center">',
  'const LogoContainer = ({ isThinking, isStreaming }: { isThinking: boolean; isStreaming: boolean }) => {\n  return (\n    <motion.div animate={isThinking ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="relative flex items-center justify-center">'
);
content = content.replace(
  '        <Logo size={20} animate={isThinking || isStreaming} />\n      </div>\n    </div>\n  );\n};',
  '        <Logo size={20} animate={isThinking || isStreaming} />\n      </div>\n    </motion.div>\n  );\n};'
);

fs.writeFileSync('src/App.tsx', content);

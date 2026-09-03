import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

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
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-widest mt-1"
                                >
                                  {m.content ? "Streaming Solutions..." : <Timer status="Composing response" />}
                                </motion.span>
                              )}`;
content = content.replace(titleTarget, titleReplacement);

const logoTarget = 'const LogoContainer = ({ isThinking, isStreaming }: { isThinking?: boolean; isStreaming?: boolean }) => {';
const logoReplacement = logoTarget + '\n  return (\n    <motion.div\n      animate={isThinking ? { scale: [1, 1.15, 1] } : { scale: 1 }}\n      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}\n      className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center"\n    >';
// Replace the start of the return in LogoContainer
content = content.replace('return (\n    <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">', '');
content = content.replace(logoTarget, logoReplacement);

// Fix the closing div of LogoContainer
content = content.replace('</div>\n  );\n};', '</motion.div>\n  );\n};');

fs.writeFileSync('src/App.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// We will add the states:
const statesBlock = '  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);\n  const [editMessageContent, setEditMessageContent] = useState("");\n';
content = content.replace(/const \[activeSessionId, setActiveSessionId\] = useState<string \| null>\(null\);\n/, 'const [activeSessionId, setActiveSessionId] = useState<string | null>(null);\n' + statesBlock);

// We need to add handleEditMessageSubmit
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
`;
content = content.replace(/const handleSendMessage = async/g, editHandler + '\n  const handleSendMessage = async');

fs.writeFileSync('src/App.tsx', content);

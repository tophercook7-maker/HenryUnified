import { useState } from "react";
import "./index.css";

export default function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, "You: " + input]);
    setInput("");
  };

  return (
    <div className="app dark">
      <aside className="sidebar">Henry AI</aside>
      <main className="chat">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className="bubble">{m}</div>
          ))}
        </div>
        <div className="inputRow">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type and press Enter..."
          />
          <button onClick={send}>Send</button>
        </div>
      </main>
    </div>
  );
}

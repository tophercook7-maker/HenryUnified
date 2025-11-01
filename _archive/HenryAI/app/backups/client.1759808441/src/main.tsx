import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
const el = document.getElementById("root");
if(!el) throw new Error(
"Missing #root element in index.html"
);
createRoot(el).render(<App />);

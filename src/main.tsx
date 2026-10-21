
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initI18n } from "./lib/i18n";
  import "./styles/index.css";

  initI18n();
  createRoot(document.getElementById("root")!).render(<App />);
  
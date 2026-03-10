import { Component } from "react";
import { STORAGE_KEY } from "../constants.js";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Rainmakers crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px", fontFamily: "'Courier New', monospace", padding: "40px" }}>
          <div style={{ fontSize: "64px" }}>⚠</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff4444", letterSpacing: "4px" }}>SYSTEM FAILURE</div>
          <div style={{ fontSize: "14px", color: "#888", maxWidth: "400px", textAlign: "center" }}>A critical error crashed the game engine. Your save may be corrupted. Rebooting will start a fresh game.</div>
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
            style={{ background: "#0d2a0d", border: "2px solid #00ff88", color: "#00ff88", padding: "12px 32px", cursor: "pointer", borderRadius: "4px", fontFamily: "inherit", fontSize: "14px", letterSpacing: "2px" }}>
            ⚡ REBOOT GAME
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

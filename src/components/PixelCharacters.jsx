export const ROLE_COLORS = {
  rainmaker: "#ffbb33",
  architect: "#00aaff",
  engineer: "#bb88ff",
  ops: "#00ff88",
};

export const PixelFigure = ({ color = "#00ff88", size = 1, animated = false }) => (
  <div style={{ display: "inline-block", imageRendering: "pixelated", transform: `scale(${size})`, transformOrigin: "bottom center" }}>
    <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
      <rect x="5" y="17" width="6" height="4" fill="#8B6914" />
      <rect x="6" y="16" width="4" height="1" fill="#8B6914" />
      <rect x="3" y="10" width="10" height="8" fill="#1a1a2e" />
      <rect x="6" y="10" width="4" height="8" fill="#16213e" />
      <rect x="7" y="11" width="2" height="5" fill={color} />
      <rect x="1" y="10" width="2" height="6" fill="#1a1a2e" />
      <rect x="13" y="10" width="2" height="6" fill="#1a1a2e" />
      <rect x="1" y="16" width="2" height="2" fill="#f4c78f" />
      <rect x="13" y="16" width="2" height="2" fill="#f4c78f" />
      <rect x="4" y="3" width="8" height="7" fill="#f4c78f" />
      <rect x="4" y="3" width="8" height="2" fill="#2c1810" />
      <rect x="5" y="7" width="2" height="1" fill="#000" />
      <rect x="9" y="7" width="2" height="1" fill="#000" />
      <rect x="6" y="9" width="4" height="1" fill="#c0392b" />
      <rect x="4" y="18" width="3" height="5" fill="#2c3e50" />
      <rect x="9" y="18" width="3" height="5" fill="#2c3e50" />
      <rect x="3" y="22" width="4" height="2" fill="#1a1a1a" />
      <rect x="9" y="22" width="4" height="2" fill="#1a1a1a" />
      {animated && <rect x="7" y="11" width="2" height="2" fill={color} opacity="0.8" />}
    </svg>
  </div>
);

export const PixelRival = ({ color = "#ff4444" }) => (
  <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
    <rect x="4" y="3" width="8" height="7" fill="#f4c78f" />
    <rect x="4" y="3" width="8" height="2" fill="#8B0000" />
    <rect x="5" y="7" width="2" height="1" fill="#ff0000" />
    <rect x="9" y="7" width="2" height="1" fill="#ff0000" />
    <rect x="6" y="9" width="4" height="1" fill="#000" />
    <rect x="3" y="10" width="10" height="8" fill="#8B0000" />
    <rect x="7" y="11" width="2" height="5" fill={color} />
    <rect x="1" y="10" width="2" height="6" fill="#8B0000" />
    <rect x="13" y="10" width="2" height="6" fill="#8B0000" />
    <rect x="1" y="16" width="2" height="2" fill="#f4c78f" />
    <rect x="13" y="16" width="2" height="2" fill="#f4c78f" />
    <rect x="4" y="18" width="3" height="5" fill="#4a0000" />
    <rect x="9" y="18" width="3" height="5" fill="#4a0000" />
    <rect x="3" y="22" width="4" height="2" fill="#1a1a1a" />
    <rect x="9" y="22" width="4" height="2" fill="#1a1a1a" />
  </svg>
);

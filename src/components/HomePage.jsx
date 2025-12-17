export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-hero">
          <h1 className="home-title">Welcome to Mod Manager</h1>
          <p className="home-subtitle">Organize and manage your game mods with ease</p>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>Multi-Game Support</h3>
            <p>Manage mods for multiple games in one place</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📁</div>
            <h3>Easy Organization</h3>
            <p>Categories, tags, and notes to keep everything organized</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Quick Toggle</h3>
            <p>Enable or disable mods with a single click</p>
          </div>
        </div>

        <div className="home-action">
          <p className="home-hint">Select a game from the sidebar to get started</p>
        </div>
      </div>
    </div>
  );
}

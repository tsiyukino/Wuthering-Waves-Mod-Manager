export default function Sidebar({ view, onChangeView }) {
  return (
    <aside className="sidebar">
      <div className="logo">Mod Manager</div>

      <nav>
        <div
          className={`nav-item ${view === "manager" ? "active" : ""}`}
          onClick={() => onChangeView("manager")}
        >
          <span>📁</span>
          <span>File Manager</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          onClick={() => onChangeView("settings")}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
}

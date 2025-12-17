import { useState } from "react";

export default function Sidebar({ view, onChangeView, onClearSelections, hasGameSelected }) {
  const [collapsed, setCollapsed] = useState(true);

  function handleViewChange(newView) {
    // Check if game needs to be selected for this view
    if (!hasGameSelected && (newView === "manager" || newView === "tags")) {
      return; // Don't allow navigation
    }

    if (onClearSelections) {
      onClearSelections();
    }
    onChangeView(newView);
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <div className="logo">Mod Manager</div>}
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "☰" : "×"}
        </button>
      </div>

      <nav>
        <div
          className={`nav-item ${view === "home" ? "active" : ""}`}
          onClick={() => handleViewChange("home")}
          title="Home"
        >
          <span>🏠</span>
          {!collapsed && <span>Home</span>}
        </div>

        <div
          className={`nav-item ${view === "games" ? "active" : ""}`}
          onClick={() => handleViewChange("games")}
          title="Games"
        >
          <span>🎮</span>
          {!collapsed && <span>Games</span>}
        </div>

        <div className="sidebar-divider"></div>

        <div
          className={`nav-item ${view === "manager" ? "active" : ""} ${!hasGameSelected ? "disabled" : ""}`}
          onClick={() => handleViewChange("manager")}
          title={hasGameSelected ? "File Manager" : "Select a game first"}
        >
          <span>📁</span>
          {!collapsed && <span>File Manager</span>}
        </div>

        <div
          className={`nav-item ${view === "tags" ? "active" : ""} ${!hasGameSelected ? "disabled" : ""}`}
          onClick={() => handleViewChange("tags")}
          title={hasGameSelected ? "Tags" : "Select a game first"}
        >
          <span>🏷️</span>
          {!collapsed && <span>Tags</span>}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          onClick={() => handleViewChange("settings")}
          title="Settings"
        >
          <span>⚙️</span>
          {!collapsed && <span>Settings</span>}
        </div>
      </div>
    </aside>
  );
}

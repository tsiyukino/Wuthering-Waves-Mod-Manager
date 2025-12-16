import { useState } from "react";

export default function Sidebar({ view, onChangeView, onClearSelections }) {
  const [collapsed, setCollapsed] = useState(true);

  function handleViewChange(newView) {
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
          className={`nav-item ${view === "manager" ? "active" : ""}`}
          onClick={() => handleViewChange("manager")}
          title="File Manager"
        >
          <span>📁</span>
          {!collapsed && <span>File Manager</span>}
        </div>

        <div
          className={`nav-item ${view === "tags" ? "active" : ""}`}
          onClick={() => handleViewChange("tags")}
          title="Tags"
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

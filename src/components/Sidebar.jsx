import { useState } from "react";
import Icon from "./IconSimple";

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
          <Icon name={collapsed ? "menu" : "close"} size={24} />
        </button>
      </div>

      <nav>
        <div
          className={`nav-item ${view === "home" ? "active" : ""}`}
          onClick={() => handleViewChange("home")}
          title="Home"
        >
          <Icon name="home" size={20} />
          {!collapsed && <span>Home</span>}
        </div>

        <div
          className={`nav-item ${view === "games" ? "active" : ""}`}
          onClick={() => handleViewChange("games")}
          title="Games"
        >
          <Icon name="games" size={20} />
          {!collapsed && <span>Games</span>}
        </div>

        <div className="sidebar-divider"></div>

        <div
          className={`nav-item ${view === "manager" ? "active" : ""} ${!hasGameSelected ? "disabled" : ""}`}
          onClick={() => handleViewChange("manager")}
          title={hasGameSelected ? "File Manager" : "Select a game first"}
        >
          <Icon name="folder" size={20} />
          {!collapsed && <span>File Manager</span>}
        </div>

        <div
          className={`nav-item ${view === "tags" ? "active" : ""} ${!hasGameSelected ? "disabled" : ""}`}
          onClick={() => handleViewChange("tags")}
          title={hasGameSelected ? "Tags" : "Select a game first"}
        >
          <Icon name="tags" size={20} />
          {!collapsed && <span>Tags</span>}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          onClick={() => handleViewChange("settings")}
          title="Settings"
        >
          <Icon name="settings" size={20} />
          {!collapsed && <span>Settings</span>}
        </div>
      </div>
    </aside>
  );
}

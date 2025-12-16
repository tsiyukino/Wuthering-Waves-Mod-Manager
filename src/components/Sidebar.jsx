export default function Sidebar({ view, onChangeView }) {
  return (
    <aside className="sidebar">
      <h1>WWMM</h1>

      <button onClick={() => onChangeView("manager")}>
        Manager
      </button>

      <button onClick={() => onChangeView("settings")}>
        Settings
      </button>
    </aside>
  );
}

"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_USERS_MAP } from "@/context/AppContext";
import { Route } from "@/types";

interface NavItem {
  route: Route;
  label: string;
  showCount?: boolean;
  showEventCount?: boolean;
  showCrisisCount?: boolean;
}

const overviewNav: NavItem[] = [
  { route: "dashboard", label: "Dashboard", showCount: true },
  { route: "alerts", label: "Alerts" },
  { route: "events", label: "Live Events", showEventCount: true },
  { route: "crisis", label: "Crisis Response", showCrisisCount: true },
];

const networkNav: NavItem[] = [
  { route: "suppliers", label: "Suppliers" },
  { route: "network", label: "Network Map" },
  { route: "contracts", label: "Contracts" },
];

const intelligenceNav: NavItem[] = [
  { route: "analytics", label: "Analytics" },
  { route: "esg", label: "ESG & Compliance" },
  { route: "reports", label: "Reports" },
];

const systemNav: NavItem[] = [
  { route: "admin", label: "Admin" },
  { route: "settings", label: "Settings" },
];

function NavButton({ route, label, showCount, showEventCount, showCrisisCount }: NavItem) {
  const { route: currentRoute, setRoute } = useApp();
  const isActive = currentRoute === route || (route === "suppliers" && currentRoute === "supplier");

  return (
    <button
      className={`nav-btn ${isActive ? "active" : ""}`}
      onClick={() => setRoute(route)}
    >
      <span>{label}</span>
      {showCount && <span className="nav-count">3</span>}
      {showEventCount && <span className="nav-count">8</span>}
      {showCrisisCount && <span className="nav-count">2</span>}
    </button>
  );
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <>
      <div className="nav-label">{label}</div>
      {items.map((item) => <NavButton key={item.route} {...item} />)}
    </>
  );
}


export function Sidebar() {
  const { role, darkMode, toggleDarkMode } = useApp();
  const user = ROLE_USERS_MAP[role];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <img src="/logo.png" alt="Chain Verity" />
        </div>
      </div>

      <NavSection label="Overview" items={overviewNav} />
      <NavSection label="Network" items={networkNav} />
      <NavSection label="Intelligence" items={intelligenceNav} />
      <NavSection label="System" items={systemNav} />

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode">
          <span>{darkMode ? "Dark mode" : "Light mode"}</span>
          <div className={`theme-toggle-track ${darkMode ? "on" : ""}`}>
            <div className="theme-toggle-thumb" />
          </div>
        </button>

        <div className="user-row">
          <div className="user-av">{user.initials}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.title}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

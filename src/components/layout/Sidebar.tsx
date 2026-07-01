"use client";

import { useApp } from "@/context/AppContext";
import { ROLE_USERS_MAP } from "@/context/AppContext";
import { Route } from "@/types";
import { ROLE_ROUTES } from "@/lib/roles";

interface NavItem {
  route: Route;
  label: string;
  badge?: string;
}

const overviewNav: NavItem[] = [
  { route: "dashboard", label: "Dashboard" },
  { route: "alerts", label: "Alerts", badge: "4" },
  { route: "events", label: "Live Events", badge: "8" },
  { route: "crisis", label: "Crisis Response", badge: "3" },
];

const networkNav: NavItem[] = [
  { route: "suppliers", label: "Suppliers" },
  { route: "geomap", label: "Risk Map" },
  { route: "network", label: "Network Map" },
  { route: "subtier", label: "Sub-Tier Intelligence" },
  { route: "contracts", label: "Contracts" },
];

const intelligenceNav: NavItem[] = [
  { route: "analytics", label: "Analytics" },
  { route: "esg", label: "ESG & Compliance" },
  { route: "recovery", label: "Recovery Intel" },
  { route: "commodities", label: "Commodities" },
  { route: "assessments", label: "Assessments" },
  { route: "reports", label: "Reports" },
];

const systemNav: NavItem[] = [
  { route: "admin", label: "Admin" },
  { route: "settings", label: "Settings" },
];

function NavButton({ route, label, badge }: NavItem) {
  const { route: currentRoute, setRoute } = useApp();
  const isActive = currentRoute === route || (route === "suppliers" && currentRoute === "supplier");
  return (
    <button className={`nav-btn ${isActive ? "active" : ""}`} onClick={() => setRoute(route)}>
      <span>{label}</span>
      {badge && <span className="nav-count">{badge}</span>}
    </button>
  );
}

function NavSection({ label, items, allowed }: { label: string; items: NavItem[]; allowed: Route[] }) {
  const visible = items.filter((i) => allowed.includes(i.route));
  if (!visible.length) return null;
  return (
    <>
      <div className="nav-label">{label}</div>
      {visible.map((item) => <NavButton key={item.route} {...item} />)}
    </>
  );
}

export function Sidebar() {
  const { role, darkMode, toggleDarkMode, mobileSidebarOpen, setMobileSidebarOpen } = useApp();
  const user = ROLE_USERS_MAP[role];
  const allowed = ROLE_ROUTES[role];

  return (
    <aside className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <img src="/logo-dark.png" alt="Chain Verity" className="brand-logo" />
        <button className="sidebar-close" onClick={() => setMobileSidebarOpen(false)} aria-label="Close menu">✕</button>
      </div>

      <div className="sidebar-nav-scroll">
        <NavSection label="Overview" items={overviewNav} allowed={allowed} />
        <NavSection label="Network" items={networkNav} allowed={allowed} />
        <NavSection label="Intelligence" items={intelligenceNav} allowed={allowed} />
        <NavSection label="System" items={systemNav} allowed={allowed} />
      </div>

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

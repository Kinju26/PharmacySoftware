"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, MANAGEMENT_NAV, OVERVIEW_NAV } from "@/lib/nav";
import { usePharmacy } from "@/context/PharmacyContext";

export function Sidebar() {
  const pathname = usePathname();
  const { db, selectedBranches, setSelectedBranches, logout, branchNames } = usePharmacy();
  const co = db.company;

  function onBranchChange(name: string, checked: boolean) {
    const current = selectedBranches ?? branchNames;
    const next = checked ? [...current.filter((n) => n !== name), name] : current.filter((n) => n !== name);
    const unique = Array.from(new Set(next));
    if (!unique.length || unique.length === branchNames.length) {
      setSelectedBranches(null);
      return;
    }
    setSelectedBranches(unique);
  }

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <div className="brand-mark">
          {co.logo ? (
            <img
              src={co.logo}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }}
            />
          ) : (
            "✚"
          )}
        </div>
        <div>
          <strong>{co.name || "Canadian Pharmacy OS"}</strong>
          <small>MASTER ADMIN PANEL</small>
        </div>
      </div>

      <div className="nav-caption">Branches</div>
      <div className="branch-picker">
        {db.branches.length ? (
          db.branches.map((b) => (
            <label className="br-opt" key={b.id}>
              <input
                type="checkbox"
                value={b.name}
                checked={!selectedBranches || selectedBranches.includes(b.name)}
                onChange={(e) => onBranchChange(b.name, e.target.checked)}
              />
              <span>{b.name}</span>
              <small>{b.code}</small>
            </label>
          ))
        ) : (
          <span className="br-empty">No branches yet</span>
        )}
      </div>

      <div className="nav-caption">Overview</div>
      <nav className="nav">
        {OVERVIEW_NAV.map((item) => (
          <Link key={item.page} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ico">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="nav-caption">Management</div>
      <nav className="nav">
        {MANAGEMENT_NAV.map((item) => (
          <Link key={item.page} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ico">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="nav-caption">Administration</div>
      <nav className="nav">
        {ADMIN_NAV.map((item) => (
          <Link key={item.page} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span className="ico">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          <span className="ico">↪</span>Sign Out
        </button>
      </nav>
      <div className="side-bottom">
        Secure administrator workspace
        <br />
        Local demo database · This browser only
      </div>
    </aside>
  );
}

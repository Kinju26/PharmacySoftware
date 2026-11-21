"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PAGE_TITLES, ALL_NAV } from "@/lib/nav";
import { todayLabel } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const current = ALL_NAV.find((n) => n.href === pathname);
  const title = current ? PAGE_TITLES[current.page] : "Dashboard";
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(todayLabel());
  }, []);

  return (
    <header className="topbar">
      <div className="crumb">
        Canadian Pharmacy OS <span style={{ color: "#b3c0c9" }}> / </span>
        <b>{title}</b>
      </div>
      <div className="top-actions">
        <span className="top-date">{dateLabel}</span>
        <div className="profile">
          <div className="avatar">MA</div>
          <div>
            <strong>Master Admin</strong>
            <small>System Administrator</small>
          </div>
        </div>
      </div>
    </header>
  );
}

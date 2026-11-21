"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { usePharmacy } from "@/context/PharmacyContext";
import { longToday, money } from "@/lib/utils";

const WORKFLOW: [string, string][] = [
  ["Received", "New intake"],
  ["Clinical Verification", "Pharmacist review"],
  ["Insurance Adjudication", "Payer response"],
  ["Preparation", "Dispensing queue"],
  ["Ready", "Awaiting pickup"],
  ["Completed", "Closed prescriptions"],
];

const QUICK = [
  ["users", "♙", "User Management", "Staff and roles", "/users"],
  ["patients", "♡", "Patient Records", "Patient profiles", "/patients"],
  ["prescriptions", "▤", "Prescriptions", "Review workflow", "/prescriptions"],
  ["inventory", "▥", "Inventory", "Stock and expiry", "/inventory"],
  ["claims", "▧", "Insurance Claims", "Payer processing", "/claims"],
  ["reports", "▨", "Reports & Analytics", "Operational insights", "/reports"],
] as const;

export function DashboardView() {
  const { db, exportJson } = usePharmacy();
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(longToday());
  }, []);

  const low = db.inventory.filter((x) => Number(x.stock) <= Number(x.reorder)).length;
  const totalValue = db.inventory.reduce((s, x) => s + Number(x.stock) * Number(x.unitCost), 0);
  const pending = db.prescriptions.filter((x) => !["Completed", "Picked Up", "Delivered"].includes(x.status)).length;
  const rejected = db.claims.filter((x) => x.status === "Rejected").length;
  const completed = db.prescriptions.filter((x) => x.status === "Completed").length;
  const totalRx = db.prescriptions.length;
  const paidClaims = db.claims.filter((x) => x.status === "Paid").reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="fade">
      <section className="dash-welcome">
        <div className="welcome-copy">
          <div className="welcome-kicker">
            <span className="welcome-pulse" /> MASTER ADMIN WORKSPACE
          </div>
          <h2>
            Good day, Administrator <span>✦</span>
          </h2>
          <p>
            Your pharmacy operations at a glance. Monitor activity, keep workflows moving and stay ahead of important
            tasks.
          </p>
          <div className="welcome-meta">
            <span>◷ &nbsp; {today}</span>
            <span>▣ &nbsp; {db.locations.length} configured locations</span>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-cross">✚</div>
          <div className="art-label">
            PHARMACY
            <br />
            OPERATIONS
          </div>
        </div>
      </section>

      <PageHead title="Overview" desc="A clear view of your pharmacy network and daily operations.">
        <button className="btn btn-soft" type="button" onClick={exportJson}>
          ⇩ &nbsp; Export overview
        </button>
      </PageHead>

      <div className="grid stats">
        <StatCard label="Total Users" value={db.users.length} note="Registered staff accounts" ico="♙" />
        <StatCard label="Patients" value={db.patients.length} note="Patient records in system" ico="♡" />
        <StatCard label="Open Prescriptions" value={pending} note="Across active workflow stages" ico="▤" />
        <StatCard label="Low Stock Items" value={low} note="Products needing attention" ico="▥" />
      </div>

      <div className="grid dash-feature-grid">
        <section className="panel workflow-panel">
          <div className="panel-title">
            <div>
              <h3>Prescription Workflow</h3>
              <small className="panel-subtitle">Current distribution by stage</small>
            </div>
            <span className="soft-tag">LIVE DEMO DATA</span>
          </div>
          <div className="workflow-list">
            {WORKFLOW.map(([name, desc]) => {
              const n = db.prescriptions.filter((x) => x.status === name).length;
              const pct = totalRx ? Math.round((n / totalRx) * 100) : 0;
              return (
                <div className="workflow-row" key={name}>
                  <div className="workflow-label">
                    <span>
                      <b>{name}</b>
                      <small>{desc}</small>
                    </span>
                    <strong>{n}</strong>
                  </div>
                  <div className="workflow-track">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="workflow-foot">
            <span>{totalRx} prescriptions recorded</span>
            <span>{totalRx ? Math.round((completed / totalRx) * 100) : 0}% completed</span>
          </div>
        </section>

        <section className="panel snapshot-panel">
          <div className="panel-title">
            <div>
              <h3>Operational Snapshot</h3>
              <small className="panel-subtitle">Key business indicators</small>
            </div>
            <span className="snapshot-icon">◈</span>
          </div>
          <div className="snapshot-total">
            <span>Inventory valuation</span>
            <strong>{money(totalValue)}</strong>
            <small>Based on current stock × unit cost</small>
          </div>
          <div className="snapshot-metrics">
            <div>
              <span>Paid claims</span>
              <b>{money(paidClaims)}</b>
            </div>
            <div>
              <span>Rejected claims</span>
              <b className={rejected ? "text-alert" : ""}>{rejected}</b>
            </div>
            <div>
              <span>Active staff</span>
              <b>{db.users.filter((x) => x.status === "Active").length}</b>
            </div>
            <div>
              <span>Locations</span>
              <b>{db.locations.length}</b>
            </div>
          </div>
        </section>
      </div>

      <div className="grid dash-lower-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Recent Activity</h3>
              <small className="panel-subtitle">Latest actions in this workspace</small>
            </div>
            <Link className="text-link" href="/audit">
              View audit log →
            </Link>
          </div>
          <div className="activity">
            {db.audit.slice(0, 5).length ? (
              db.audit.slice(0, 5).map((a) => (
                <div className="activity-item" key={a.id}>
                  <i className="activity-dot" />
                  <div>
                    <b>
                      {a.action} — {a.detail}
                    </b>
                    <small>{a.time}</small>
                  </div>
                </div>
              ))
            ) : (
              <span className="muted">Your system activity will appear here.</span>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Quick Access</h3>
              <small className="panel-subtitle">Jump straight into a module</small>
            </div>
          </div>
          <div className="grid quick-grid">
            {QUICK.map((x) => (
              <Link className="quick" href={x[4]} key={x[0]}>
                <span className="quick-icon">{x[1]}</span>
                <span>
                  <b>{x[2]}</b>
                  <small>{x[3]}</small>
                </span>
                <i>↗</i>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-disclaimer">
        <span>ⓘ</span> Demo environment · figures are calculated from records saved in this browser. Live pharmacy
        integrations are not connected.
      </div>
    </div>
  );
}

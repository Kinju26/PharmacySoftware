"use client";

import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { usePharmacy } from "@/context/PharmacyContext";
import { money } from "@/lib/utils";

const RX_STATUSES = [
  "Received",
  "Clinical Verification",
  "Insurance Adjudication",
  "Preparation",
  "Ready",
  "Completed",
  "Manual Review",
] as const;

export function ReportsView() {
  const { db } = usePharmacy();
  const totalRx = db.prescriptions.length;
  const complete = db.prescriptions.filter((x) => x.status === "Completed").length;
  const invVal = db.inventory.reduce((s, x) => s + x.stock * x.unitCost, 0);
  const claimTotal = db.claims.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="fade">
      <PageHead title="Reports & Analytics" desc="Calculated operational summaries from records stored in this browser." />
      <div className="grid stats">
        <StatCard label="Total Prescriptions" value={totalRx} note="All statuses" ico="▤" />
        <StatCard label="Completed" value={complete} note="Completed workflow records" ico="✓" />
        <StatCard label="Inventory Value" value={money(invVal)} note="Stock × unit cost" ico="▥" />
        <StatCard label="Claim Value" value={money(claimTotal)} note="Sum of recorded claims" ico="▧" />
      </div>
      <div className="grid two-col">
        <section className="panel">
          <div className="panel-title">
            <h3>Prescription Status Distribution</h3>
          </div>
          {RX_STATUSES.map((s) => {
            const n = db.prescriptions.filter((x) => x.status === s).length;
            const p = totalRx ? Math.round((n / totalRx) * 100) : 0;
            return (
              <div key={s}>
                <div className="metric-line">
                  <span>{s}</span>
                  <b>
                    {n} · {p}%
                  </b>
                </div>
                <div className="bar">
                  <i style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}
        </section>
        <section className="panel">
          <div className="panel-title">
            <h3>Inventory & Claims</h3>
          </div>
          <div className="metric-line">
            <span>Inventory cost value</span>
            <b>{money(invVal)}</b>
          </div>
          <div className="metric-line">
            <span>Low stock products</span>
            <b>{db.inventory.filter((x) => x.stock <= x.reorder).length}</b>
          </div>
          <div className="metric-line">
            <span>Claims submitted in records</span>
            <b>{db.claims.length}</b>
          </div>
          <div className="metric-line">
            <span>Paid claim total</span>
            <b>{money(db.claims.filter((x) => x.status === "Paid").reduce((s, x) => s + Number(x.amount), 0))}</b>
          </div>
          <div className="metric-line">
            <span>Rejected claims</span>
            <b>{db.claims.filter((x) => x.status === "Rejected").length}</b>
          </div>
        </section>
      </div>
      <div className="notice">
        These figures are calculated from the sample or records entered in this browser. They are not connected to a
        live pharmacy, dispensing, accounting or payer system.
      </div>
    </div>
  );
}

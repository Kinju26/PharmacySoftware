"use client";

import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { usePharmacy } from "@/context/PharmacyContext";

export function AuditView() {
  const { db, showToast } = usePharmacy();

  function exportAudit() {
    if (!db.audit.length) {
      showToast("No records to export");
      return;
    }
    const headers = ["id", "action", "detail", "user", "time"];
    const csv = [
      headers.join(","),
      ...db.audit.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  }

  return (
    <div className="fade">
      <PageHead title="Audit Logs" desc="Recorded actions in this local demo database.">
        <button className="btn btn-soft" type="button" onClick={exportAudit}>
          Export CSV
        </button>
      </PageHead>
      <div className="panel">
        <DataTable
          headers={["Event ID", "Action", "Details", "User", "Timestamp"]}
          rows={db.audit.map((a) => [a.id, a.action, a.detail, a.user, a.time])}
        />
      </div>
    </div>
  );
}

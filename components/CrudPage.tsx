"use client";

import { useMemo, useState } from "react";
import { configs } from "@/lib/configs";
import type { CollectionKey } from "@/lib/types";
import { money } from "@/lib/utils";
import { usePharmacy } from "@/context/PharmacyContext";
import { DataTable } from "@/components/DataTable";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { PageHead } from "@/components/PageHead";
import { RecordModal } from "@/components/RecordModal";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";

type CrudPageProps = {
  type: CollectionKey;
};

type AnyRecord = Record<string, unknown> & { id: string; name?: string; photo?: string };

export function CrudPage({ type }: CrudPageProps) {
  const { scopedRecords, selectedBranches, removeRecord, exportCsv } = usePharmacy();
  const config = configs[type];
  const [term, setTerm] = useState("");
  const [modal, setModal] = useState<{ record: AnyRecord | null } | null>(null);

  const records = scopedRecords(type) as AnyRecord[];
  const filtered = useMemo(() => {
    const q = term.toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      Object.entries(r).some(([k, v]) => k !== "password" && k !== "photo" && String(v).toLowerCase().includes(q)),
    );
  }, [records, term]);

  function cellVal(r: AnyRecord, k: string) {
    if (k === "photo") return <EmployeeAvatar name={String(r.name || "")} photo={String(r.photo || "")} />;
    if (k === "_value") return money(Number(r.stock) * Number(r.unitCost));
    if (k === "_status") {
      return <StatusPill value={Number(r.stock) <= Number(r.reorder) ? "Low Stock" : "In Stock"} />;
    }
    if (k === "status") return <StatusPill value={String(r.status || "")} />;
    return String(r[k] ?? "");
  }

  const rows = filtered.map((r) => [
    ...config.keys.map((k) => cellVal(r, k)),
    <div className="row-actions" key={`${r.id}-actions`}>
      <button className="mini-btn" type="button" onClick={() => setModal({ record: r })}>
        Edit
      </button>
      <button className="mini-btn" type="button" onClick={() => removeRecord(type, r.id)}>
        Delete
      </button>
    </div>,
  ]);

  const scope =
    type === "users" ? (selectedBranches ? ` · ${selectedBranches.length} branch(es) selected` : " · All branches") : "";

  return (
    <div className="fade">
      <PageHead title={config.title} desc={config.desc}>
        <button className="btn btn-primary" type="button" onClick={() => setModal({ record: null })}>
          {config.button}
        </button>
      </PageHead>

      {type === "inventory" ? (
        <div className="grid stats">
          <StatCard label="Inventory Items" value={records.length} note="Tracked products" ico="▥" />
          <StatCard
            label="Total Units"
            value={records.reduce((s, x) => s + Number(x.stock), 0)}
            note="On-hand quantity"
            ico="▤"
          />
          <StatCard
            label="Low Stock"
            value={records.filter((x) => Number(x.stock) <= Number(x.reorder)).length}
            note="Reorder attention"
            ico="!"
          />
          <StatCard
            label="Stock Valuation"
            value={money(records.reduce((s, x) => s + Number(x.stock) * Number(x.unitCost), 0))}
            note="At recorded unit cost"
            ico="CAD"
          />
        </div>
      ) : null}

      {type === "claims" ? (
        <div className="grid stats">
          <StatCard label="Total Claims" value={records.length} note="Recorded claims" ico="▧" />
          <StatCard
            label="Paid Amount"
            value={money(
              records.filter((x) => x.status === "Paid").reduce((s, x) => s + Number(x.amount), 0),
            )}
            note="Paid status total"
            ico="✓"
          />
          <StatCard
            label="Pending"
            value={records.filter((x) => x.status === "Pending" || x.status === "Submitted").length}
            note="Awaiting payer response"
            ico="◷"
          />
          <StatCard
            label="Rejected"
            value={records.filter((x) => x.status === "Rejected").length}
            note="Requires review"
            ico="!"
          />
        </div>
      ) : null}

      <div className="panel">
        <div className="toolbar">
          <input
            className="control search"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <span className="muted" style={{ fontSize: 11 }}>
            {records.length} records{scope}
          </span>
          <button className="btn btn-soft" type="button" onClick={() => exportCsv(type)}>
            Export CSV
          </button>
        </div>
        <DataTable headers={config.cols} rows={rows} />
      </div>

      {modal ? <RecordModal type={type} record={modal.record} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

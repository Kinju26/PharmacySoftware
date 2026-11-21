"use client";

import { FormEvent, useState } from "react";
import { configs } from "@/lib/configs";
import { readFileAsDataUrl } from "@/lib/utils";
import { usePharmacy } from "@/context/PharmacyContext";
import { DataTable } from "@/components/DataTable";
import { PageHead } from "@/components/PageHead";
import { RecordModal } from "@/components/RecordModal";
import { StatusPill } from "@/components/StatusPill";
import type { BranchRecord } from "@/lib/types";

export function SettingsView() {
  const { db, companyCode, saveCompany, removeRecord } = usePharmacy();
  const co = db.company;
  const [msg, setMsg] = useState("");
  const [logoPreview, setLogoPreview] = useState(co.logo || "");
  const [modal, setModal] = useState<{ record: BranchRecord | null } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!name) {
      setMsg("Company name is required.");
      return;
    }
    const file = (form.elements.namedItem("logo") as HTMLInputElement).files?.[0];
    let logo = co.logo || "";
    if (file) {
      if (file.size > 300 * 1024) {
        setMsg("Logo must be under 300 KB.");
        return;
      }
      logo = await readFileAsDataUrl(file);
    }
    saveCompany({
      name,
      contact: (form.elements.namedItem("contact") as HTMLInputElement).value.trim(),
      mobile: (form.elements.namedItem("mobile") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      address: (form.elements.namedItem("address") as HTMLTextAreaElement).value.trim(),
      logo,
    });
    setLogoPreview(logo);
  }

  return (
    <div className="fade">
      <PageHead
        title="System Settings"
        desc="Company profile, logo and branch master. Saved details are applied across the workspace."
      />
      <form className="panel" onSubmit={onSubmit} noValidate>
        <div className="panel-title">
          <div>
            <h3>Company Details</h3>
            <small className="panel-subtitle">Shown in the sidebar and used to generate employee codes</small>
          </div>
          <span className="soft-tag">Company code: {companyCode}</span>
        </div>
        <div className="company-top">
          <div className="logo-box">
            {logoPreview ? (
              <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span className="logo-ph">LOGO</span>
            )}
          </div>
          <div className="field" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <label>Company Logo</label>
            <input
              className="control"
              type="file"
              name="logo"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setLogoPreview(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
            <small className="muted">PNG or JPG, under 300 KB</small>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Company Name</label>
            <input className="control" name="name" defaultValue={co.name} required />
          </div>
          <div className="field">
            <label>Contact Number</label>
            <input className="control" type="tel" name="contact" defaultValue={co.contact} />
          </div>
          <div className="field">
            <label>Mobile Number</label>
            <input className="control" type="tel" name="mobile" defaultValue={co.mobile} />
          </div>
          <div className="field">
            <label>Email ID</label>
            <input className="control" type="email" name="email" defaultValue={co.email} />
          </div>
          <div className="field full">
            <label>Address</label>
            <textarea className="control" name="address" rows={2} defaultValue={co.address} />
          </div>
        </div>
        <p style={{ fontSize: 12, minHeight: 16, margin: "6px 0 0", color: "#c2410c" }}>{msg}</p>
        <div className="modal-actions">
          <button className="btn btn-primary" type="submit">
            Save Company Details
          </button>
        </div>
      </form>

      <div className="panel">
        <div className="toolbar">
          <div>
            <h3 style={{ margin: 0, color: "var(--navy)" }}>Branches</h3>
            <small className="muted">Each branch code is used in employee codes and the sidebar branch selection</small>
          </div>
          <span style={{ flex: 1 }} />
          <button className="btn btn-primary" type="button" onClick={() => setModal({ record: null })}>
            ＋ Add Branch
          </button>
        </div>
        <DataTable
          headers={configs.branches.cols}
          rows={db.branches.map((b) => [
            b.code,
            b.name,
            b.director,
            b.contact,
            b.bemail,
            b.address,
            <StatusPill key={`${b.id}-st`} value={b.status} />,
            <div className="row-actions" key={`${b.id}-act`}>
              <button className="mini-btn" type="button" onClick={() => setModal({ record: b })}>
                Edit
              </button>
              <button className="mini-btn" type="button" onClick={() => removeRecord("branches", b.id)}>
                Delete
              </button>
            </div>,
          ])}
        />
      </div>

      {modal ? <RecordModal type="branches" record={modal.record} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

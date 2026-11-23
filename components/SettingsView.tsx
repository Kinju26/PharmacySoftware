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
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);

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

      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setInviteMsg("");
          setInviteUrl("");
          setInviteBusy(true);
          const form = e.currentTarget;
          try {
            const res = await fetch("/api/auth/invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: (form.elements.namedItem("inviteName") as HTMLInputElement).value,
                email: (form.elements.namedItem("inviteEmail") as HTMLInputElement).value,
                role: (form.elements.namedItem("inviteRole") as HTMLSelectElement).value,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setInviteMsg(data.error || "Could not create invite.");
              return;
            }
            setInviteUrl(data.inviteUrl || "");
            setInviteMsg("Invite created. Share the one-time link (expires in 48 hours).");
            form.reset();
          } catch {
            setInviteMsg("Could not create invite.");
          } finally {
            setInviteBusy(false);
          }
        }}
      >
        <div className="panel-title">
          <div>
            <h3>Staff invite</h3>
            <small className="panel-subtitle">
              Admin-only. Creates a single-use link so staff can set a password and MFA. No public signup.
            </small>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Full name</label>
            <input className="control" name="inviteName" required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="control" type="email" name="inviteEmail" required />
          </div>
          <div className="field">
            <label>Role</label>
            <select className="control" name="inviteRole" defaultValue="pharmacist">
              <option value="pharmacist">Pharmacist</option>
              <option value="cashier">Cashier</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12, minHeight: 16, margin: "6px 0 0", color: "#176c68" }}>{inviteMsg}</p>
        {inviteUrl ? (
          <p style={{ fontSize: 12, wordBreak: "break-all", color: "var(--navy)" }}>{inviteUrl}</p>
        ) : null}
        <div className="modal-actions">
          <button className="btn btn-primary" type="submit" disabled={inviteBusy}>
            Create invite link
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

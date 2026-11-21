"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { configs, SINGULAR } from "@/lib/configs";
import type { CollectionKey } from "@/lib/types";
import { dateNow, readFileAsDataUrl } from "@/lib/utils";
import { usePharmacy } from "@/context/PharmacyContext";

type RecordModalProps = {
  type: CollectionKey;
  record: Record<string, unknown> | null;
  onClose: () => void;
};

export function RecordModal({ type, record, onClose }: RecordModalProps) {
  const { upsertRecord, branchNames, genUserId, genEmpCode } = usePharmacy();
  const config = configs[type];
  const isEdit = Boolean(record);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(String(record?.photo || ""));
  const [autoIds, setAutoIds] = useState({
    userId: String(record?.userId || ""),
    empCode: String(record?.empCode || ""),
  });

  const initialName = String(record?.name || "");
  const initialBranch = String(record?.branch || branchNames[0] || "");

  useEffect(() => {
    if (type !== "users" || isEdit) return;
    setAutoIds({
      userId: genUserId(initialName, null),
      empCode: genEmpCode(initialBranch, null),
    });
  }, [genEmpCode, genUserId, initialBranch, initialName, isEdit, type]);

  const fieldOptions = useMemo(() => {
    return config.fields.map((fd) => {
      if (fd[0] === "branch") return branchNames;
      const opts = fd[3];
      return typeof opts === "function" ? opts() : opts;
    });
  }, [branchNames, config.fields]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const elements = form.elements;
    const data: Record<string, unknown> = isEdit && record ? { ...record } : {};

    for (const fd of config.fields) {
      const [key, , kind] = fd;
      const el = elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
      if (kind === "auto") {
        if (isEdit && record) data[key] = record[key];
        continue;
      }
      if (kind === "file") {
        const file = (el as HTMLInputElement | null)?.files?.[0];
        if (file) {
          if (file.size > 300 * 1024) {
            setError("Image must be under 300 KB.");
            return;
          }
          data[key] = await readFileAsDataUrl(file);
        } else {
          data[key] = record?.[key] || "";
        }
        continue;
      }
      if (kind === "password") {
        const v = (el as HTMLInputElement | null)?.value || "";
        data[key] = v || record?.[key] || "";
        continue;
      }
      let v: string | number = (el as HTMLInputElement | HTMLSelectElement | null)?.value || "";
      if (kind === "number") v = Number(v || 0);
      data[key] = v;
    }

    if (type === "users" && !isEdit) {
      data.userId = autoIds.userId;
      data.empCode = autoIds.empCode;
    }

    const err = upsertRecord(type, data as Record<string, unknown> & { id: string }, isEdit);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>
            {isEdit ? "Edit" : "Add"} {SINGULAR[type] || config.title}
          </h3>
          <button className="close" type="button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            {config.fields.map((fd, i) => {
              const [key, label, kind] = fd;
              const opts = fieldOptions[i];
              const value =
                key === "userId" || key === "empCode"
                  ? autoIds[key]
                  : String(record?.[key] ?? (key === "date" ? dateNow() : ""));

              let input;
              if (kind === "select") {
                input = (
                  <select
                    className="control"
                    name={key}
                    defaultValue={value}
                    onChange={
                      type === "users" && key === "branch" && !isEdit
                        ? (e) => {
                            const nameEl = e.currentTarget.form?.elements.namedItem("name") as HTMLInputElement;
                            setAutoIds({
                              userId: genUserId(nameEl?.value || "", null),
                              empCode: genEmpCode(e.target.value, null),
                            });
                          }
                        : undefined
                    }
                  >
                    {(opts || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                );
              } else if (kind === "file") {
                input = (
                  <>
                    <input
                      className="control"
                      type="file"
                      name={key}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setPreview(String(reader.result));
                        reader.readAsDataURL(file);
                      }}
                    />
                    {preview ? <img className="pv" src={preview} alt="" /> : null}
                  </>
                );
              } else if (kind === "auto") {
                input = <input className="control" name={key} value={value} readOnly />;
              } else if (kind === "password") {
                input = (
                  <input
                    className="control"
                    type="password"
                    name={key}
                    placeholder={isEdit ? "Leave blank to keep current" : "Minimum 4 characters"}
                    required={!isEdit}
                  />
                );
              } else {
                input = (
                  <input
                    className="control"
                    type={kind}
                    name={key}
                    defaultValue={value}
                    required={["name", "email", "medication", "patient", "code"].includes(key)}
                    min={kind === "number" ? 0 : undefined}
                    step={kind === "number" ? "any" : undefined}
                    onInput={
                      type === "users" && key === "name" && !isEdit
                        ? (e) => {
                            const form = e.currentTarget.form;
                            const branchEl = form?.elements.namedItem("branch") as HTMLSelectElement;
                            setAutoIds({
                              userId: genUserId(e.currentTarget.value, null),
                              empCode: genEmpCode(branchEl?.value || "", null),
                            });
                          }
                        : undefined
                    }
                  />
                );
              }

              return (
                <div className="field" key={key}>
                  <label>{label}</label>
                  {input}
                </div>
              );
            })}
          </div>
          <p style={{ color: "#c2410c", fontSize: 12, minHeight: 16, margin: "8px 0 0" }}>{error}</p>
          <div className="modal-actions">
            <button className="btn btn-soft" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              {isEdit ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { usePharmacy } from "@/context/PharmacyContext";

export function Toast() {
  const { toast } = usePharmacy();
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}

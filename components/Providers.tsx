"use client";

import { PharmacyProvider } from "@/context/PharmacyContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <PharmacyProvider>{children}</PharmacyProvider>;
}

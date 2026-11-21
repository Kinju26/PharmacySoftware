import type { PageKey } from "@/lib/types";

export type NavItem = {
  page: PageKey;
  href: string;
  label: string;
  icon: string;
};

export const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: "Dashboard",
  users: "Users & Roles",
  patients: "Patients",
  prescriptions: "Prescriptions",
  inventory: "Inventory",
  claims: "Insurance Claims",
  locations: "Pharmacy Locations",
  branches: "Branches",
  reports: "Reports & Analytics",
  audit: "Audit Logs",
  settings: "System Settings",
};

export const OVERVIEW_NAV: NavItem[] = [
  { page: "dashboard", href: "/dashboard", label: "Dashboard", icon: "▦" },
];

export const MANAGEMENT_NAV: NavItem[] = [
  { page: "users", href: "/users", label: "Users & Roles", icon: "♙" },
  { page: "patients", href: "/patients", label: "Patients", icon: "♡" },
  { page: "prescriptions", href: "/prescriptions", label: "Prescriptions", icon: "▤" },
  { page: "inventory", href: "/inventory", label: "Inventory", icon: "▥" },
  { page: "claims", href: "/claims", label: "Insurance Claims", icon: "▧" },
  { page: "locations", href: "/locations", label: "Pharmacy Locations", icon: "⌂" },
];

export const ADMIN_NAV: NavItem[] = [
  { page: "reports", href: "/reports", label: "Reports & Analytics", icon: "▨" },
  { page: "audit", href: "/audit", label: "Audit Logs", icon: "◷" },
  { page: "settings", href: "/settings", label: "System Settings", icon: "⚙" },
];

export const ALL_NAV = [...OVERVIEW_NAV, ...MANAGEMENT_NAV, ...ADMIN_NAV];

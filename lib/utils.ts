export const DB_KEY = "canadian_pharmacy_os_demo_v1";
export const SEL_KEY = "canadian_pharmacy_branch_sel_v1";
export const AUTH_KEY = "canadian_pharmacy_os_session_v1";

export const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(n) || 0);

export const dateNow = () => new Date().toISOString().slice(0, 10);

export const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const slug = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

export const initials = (name: string) =>
  String(name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const companyCodeFromName = (name: string) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    words
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .slice(0, 4) || "CO"
  );
};

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const downloadText = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const todayLabel = () =>
  new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const longToday = () =>
  new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

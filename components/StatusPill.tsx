export function pillClass(status: string) {
  const v = String(status).toLowerCase();
  if (v.includes("active") || v === "paid" || v === "ready" || v === "completed") return "green";
  if (v.includes("pending") || v.includes("verification") || v === "received") return "amber";
  if (v.includes("reject") || v.includes("inactive") || v.includes("expired")) return "red";
  return "";
}

export function StatusPill({ value }: { value: string }) {
  return <span className={`pill ${pillClass(value)}`}>{value}</span>;
}

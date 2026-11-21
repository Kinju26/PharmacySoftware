type StatCardProps = {
  label: string;
  value: string | number;
  note: string;
  ico: string;
};

export function StatCard({ label, value, note, ico }: StatCardProps) {
  return (
    <div className="stat">
      <div className="stat-top">
        {label}
        <span className="stat-ico">{ico}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

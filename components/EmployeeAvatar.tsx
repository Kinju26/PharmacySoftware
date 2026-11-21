import { initials } from "@/lib/utils";

export function EmployeeAvatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    return <img className="emp-photo" src={photo} alt="" />;
  }
  return <span className="emp-ini">{initials(name)}</span>;
}

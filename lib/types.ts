export type RecordStatus = string;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: string;
  userId?: string;
  password?: string;
  photo?: string;
  empCode?: string;
  dob?: string;
  phone?: string;
};

export type PatientRecord = {
  id: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  province: string;
  status: string;
};

export type PrescriptionRecord = {
  id: string;
  patient: string;
  medication: string;
  din: string;
  status: string;
  date: string;
  quantity: number;
};

export type InventoryRecord = {
  id: string;
  name: string;
  din: string;
  stock: number;
  reorder: number;
  unitCost: number;
  expiry: string;
  location: string;
};

export type ClaimRecord = {
  id: string;
  prescription: string;
  patient: string;
  payer: string;
  amount: number;
  status: string;
  date: string;
};

export type LocationRecord = {
  id: string;
  name: string;
  province: string;
  phone: string;
  status: string;
};

export type AuditRecord = {
  id: string;
  action: string;
  detail: string;
  user: string;
  time: string;
};

export type CompanyProfile = {
  name: string;
  contact: string;
  mobile: string;
  email: string;
  address: string;
  logo: string;
};

export type BranchRecord = {
  id: string;
  name: string;
  code: string;
  director: string;
  address: string;
  contact: string;
  bemail: string;
  status: string;
};

export type Database = {
  users: UserRecord[];
  patients: PatientRecord[];
  prescriptions: PrescriptionRecord[];
  inventory: InventoryRecord[];
  claims: ClaimRecord[];
  locations: LocationRecord[];
  audit: AuditRecord[];
  company: CompanyProfile;
  branches: BranchRecord[];
};

export type CollectionKey =
  | "users"
  | "patients"
  | "prescriptions"
  | "inventory"
  | "claims"
  | "locations"
  | "branches";

export type PageKey =
  | "dashboard"
  | CollectionKey
  | "reports"
  | "audit"
  | "settings";

export type FieldKind = "text" | "email" | "tel" | "date" | "number" | "password" | "file" | "select" | "auto";

export type FieldDef = [
  key: string,
  label: string,
  kind: FieldKind,
  options?: string[] | (() => string[]),
];

export type CollectionConfig = {
  title: string;
  desc: string;
  button: string;
  fields: FieldDef[];
  cols: string[];
  keys: string[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  status: "active" | "inactive";
};

export type RecordMap = {
  users: UserRecord;
  patients: PatientRecord;
  prescriptions: PrescriptionRecord;
  inventory: InventoryRecord;
  claims: ClaimRecord;
  locations: LocationRecord;
  branches: BranchRecord;
};

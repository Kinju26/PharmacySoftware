"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { configs, PREFIX, REQUIRED_FIELDS } from "@/lib/configs";
import { seed } from "@/lib/seed";
import type {
  AuthUser,
  BranchRecord,
  CollectionKey,
  CompanyProfile,
  Database,
  UserRecord,
} from "@/lib/types";
import {
  clearRememberedEmail,
  getRememberedEmail,
  setRememberedEmail,
} from "@/lib/auth-security";
import {
  AUTH_KEY,
  AUTH_META_KEY,
  companyCodeFromName,
  DB_KEY,
  downloadText,
  KJ_ADMIN_EMAIL,
  KJ_ADMIN_PASS,
  KJ_KEY,
  SEL_KEY,
  slug,
  uid,
} from "@/lib/utils";

type RecordLike = Record<string, unknown> & { id: string };

type PharmacyContextValue = {
  ready: boolean;
  db: Database;
  currentUser: string | null;
  toast: string | null;
  selectedBranches: string[] | null;
  showToast: (msg: string) => void;
  login: (id: string, password: string, options?: { remember?: boolean }) => string | null;
  verifyCredentials: (id: string, password: string) => string | null;
  completeLogin: (email: string, options?: { remember?: boolean }) => void;
  register: (name: string, email: string, password: string) => string | null;
  logout: () => void;
  setSelectedBranches: (names: string[] | null) => void;
  saveCompany: (company: CompanyProfile) => void;
  upsertRecord: (type: CollectionKey, data: RecordLike, isEdit: boolean) => string | null;
  removeRecord: (type: CollectionKey, id: string) => void;
  exportJson: () => void;
  exportCsv: (type: CollectionKey) => void;
  companyCode: string;
  branchNames: string[];
  genUserId: (name: string, exceptId?: string | null) => string;
  genEmpCode: (branchName: string, exceptId?: string | null) => string;
  scopedRecords: <T extends CollectionKey>(type: T) => Database[T];
};

const PharmacyContext = createContext<PharmacyContextValue | null>(null);

function loadDb(): Database {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY) || "null");
    if (saved && saved.users && saved.patients) {
      return Object.assign(structuredClone(seed), saved) as Database;
    }
  } catch {
    /* use seed */
  }
  return structuredClone(seed);
}

function loadAuthUsers(): AuthUser[] {
  let list: AuthUser[] = [];
  try {
    list = JSON.parse(localStorage.getItem(KJ_KEY) || "[]") as AuthUser[];
  } catch {
    list = [];
  }
  if (!Array.isArray(list)) list = [];
  let admin = list.find((u) => u.email === KJ_ADMIN_EMAIL);
  if (!admin) {
    admin = {
      id: Date.now().toString(36),
      name: "Admin",
      email: KJ_ADMIN_EMAIL,
      password: KJ_ADMIN_PASS,
      role: "admin",
      status: "active",
    };
    list.unshift(admin);
  } else {
    Object.assign(admin, {
      name: "Admin",
      email: KJ_ADMIN_EMAIL,
      password: KJ_ADMIN_PASS,
      role: "admin",
      status: "active",
    });
  }
  return list;
}

function persistAuthUsers(users: AuthUser[]) {
  try {
    localStorage.setItem(KJ_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<Database>(seed);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranchesState] = useState<string[] | null>(null);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);

  const persistDb = useCallback((next: Database) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(next));
    } catch {
      setToast("Browser storage is unavailable. Changes may not persist.");
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const auditInto = useCallback((next: Database, action: string, detail: string, user: string) => {
    next.audit.unshift({
      id: uid("AUD"),
      action,
      detail,
      user,
      time: new Date().toLocaleString(),
    });
    next.audit = next.audit.slice(0, 300);
  }, []);

  const companyCode = useMemo(() => companyCodeFromName(db.company?.name || ""), [db.company?.name]);

  const branchNames = useMemo(
    () => (db.branches || []).filter((b) => b.status !== "Inactive").map((b) => b.name),
    [db.branches],
  );

  const genUserId = useCallback(
    (name: string, exceptId?: string | null) => {
      const base = slug(name) || "employee";
      let id = base;
      let n = 2;
      while (db.users.some((u) => u.userId === id && u.id !== exceptId)) {
        id = base + n;
        n += 1;
      }
      return id;
    },
    [db.users],
  );

  const genEmpCode = useCallback(
    (branchName: string, exceptId?: string | null) => {
      const branch = db.branches.find((b) => b.name === branchName);
      const pre = `${companyCode}-${(branch && branch.code) || "HQ"}-`;
      let max = 0;
      db.users.forEach((u) => {
        if (u.id !== exceptId && u.empCode && u.empCode.startsWith(pre)) {
          const n = parseInt(u.empCode.slice(pre.length), 10);
          if (n > max) max = n;
        }
      });
      return pre + String(max + 1).padStart(3, "0");
    },
    [companyCode, db.branches, db.users],
  );

  useEffect(() => {
    const loaded = loadDb();
    loaded.users.forEach((u) => {
      if (!u.userId) u.userId = slug(u.name) || "employee";
      if (!u.empCode) {
        const branch = loaded.branches.find((b) => b.name === u.branch);
        const code = companyCodeFromName(loaded.company.name);
        const pre = `${code}-${(branch && branch.code) || "HQ"}-`;
        let max = 0;
        loaded.users.forEach((other) => {
          if (other.id !== u.id && other.empCode && other.empCode.startsWith(pre)) {
            const n = parseInt(other.empCode.slice(pre.length), 10);
            if (n > max) max = n;
          }
        });
        u.empCode = pre + String(max + 1).padStart(3, "0");
      }
    });
    persistDb(loaded);
    setDb(loaded);

    const users = loadAuthUsers();
    persistAuthUsers(users);
    setAuthUsers(users);

    try {
      const sel = JSON.parse(localStorage.getItem(SEL_KEY) || "null");
      setSelectedBranchesState(Array.isArray(sel) && sel.length ? sel : null);
    } catch {
      setSelectedBranchesState(null);
    }

    try {
      const remembered = getRememberedEmail();
      const sessionUser = sessionStorage.getItem(AUTH_KEY);
      setCurrentUser(remembered || sessionUser);
      if (remembered) {
        sessionStorage.setItem(AUTH_KEY, remembered);
      }
    } catch {
      setCurrentUser(null);
    }

    setReady(true);
  }, [persistDb]);

  const verifyCredentials = useCallback(
    (id: string, password: string) => {
      const email = id.trim().toLowerCase();
      const user = authUsers.find((x) => x.email === email);
      if (!user || user.password !== password) return "Invalid email or password";
      if (user.status !== "active") return "This account is inactive.";
      return null;
    },
    [authUsers],
  );

  const completeLogin = useCallback(
    (emailRaw: string, options?: { remember?: boolean }) => {
      const email = emailRaw.trim().toLowerCase();
      const user = authUsers.find((x) => x.email === email);
      if (!user) return;
      setCurrentUser(user.email);
      try {
        sessionStorage.setItem(AUTH_KEY, user.email);
        localStorage.setItem(
          AUTH_META_KEY,
          JSON.stringify({ email: user.email, at: Date.now() }),
        );
        if (options?.remember) setRememberedEmail(user.email);
        else clearRememberedEmail();
      } catch {
        /* ignore */
      }
      setDb((prev) => {
        const next = structuredClone(prev);
        auditInto(
          next,
          user.role === "admin" ? "Admin login" : "User login",
          `${user.email} signed in`,
          user.email,
        );
        persistDb(next);
        return next;
      });
    },
    [auditInto, authUsers, persistDb],
  );

  const login = useCallback(
    (id: string, password: string, options?: { remember?: boolean }) => {
      const err = verifyCredentials(id, password);
      if (err) return err;
      completeLogin(id, options);
      return null;
    },
    [completeLogin, verifyCredentials],
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const trimmedName = name.trim();
      const normalized = email.trim().toLowerCase();
      if (!trimmedName) return "Please enter your name.";
      if (authUsers.some((x) => x.email === normalized)) return "This email is already registered.";
      if (password.length < 4) return "Password must be at least 4 characters.";
      const nextUsers: AuthUser[] = [
        ...authUsers,
        {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          name: trimmedName,
          email: normalized,
          password,
          role: "user",
          status: "active",
        },
      ];
      setAuthUsers(nextUsers);
      persistAuthUsers(nextUsers);
      return null;
    },
    [authUsers],
  );

  const logout = useCallback(() => {
    setDb((prev) => {
      const next = structuredClone(prev);
      auditInto(next, "Logout", `${currentUser || "user"} signed out`, currentUser || "user");
      persistDb(next);
      return next;
    });
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_META_KEY);
      clearRememberedEmail();
    } catch {
      /* ignore */
    }
  }, [auditInto, currentUser, persistDb]);

  const setSelectedBranches = useCallback((names: string[] | null) => {
    setSelectedBranchesState(names);
    try {
      localStorage.setItem(SEL_KEY, JSON.stringify(names));
    } catch {
      /* ignore */
    }
  }, []);

  const saveCompany = useCallback(
    (company: CompanyProfile) => {
      setDb((prev) => {
        const next = structuredClone(prev);
        next.company = company;
        auditInto(next, "Company updated", company.name, currentUser || "Master Admin");
        persistDb(next);
        return next;
      });
      showToast("Company details saved");
    },
    [auditInto, currentUser, persistDb, showToast],
  );

  const upsertRecord = useCallback(
    (type: CollectionKey, data: RecordLike, isEdit: boolean) => {
      const c = configs[type];
      const missing = REQUIRED_FIELDS.find((k) => k in data && !String(data[k] ?? "").trim());
      if (missing) {
        const field = c.fields.find((f) => f[0] === missing);
        return `Please fill: ${field ? field[1] : missing}`;
      }

      if (type === "users") {
        if (!data.branch) return "Please select a branch.";
        data.email = String(data.email || "")
          .trim()
          .toLowerCase();
        if (!isEdit && String(data.password || "").length < 4) {
          return "Password must be at least 4 characters.";
        }
      }

      if (type === "branches") {
        data.code = String(data.code || "")
          .trim()
          .toUpperCase();
      }

      let error: string | null = null;
      setDb((prev) => {
        if (type === "users") {
          const clash = prev.users.some((u) => u.email === data.email && u.id !== data.id);
          if (clash) {
            error = "This email is already used.";
            return prev;
          }
        }
        if (type === "branches") {
          const clash = prev.branches.some((b) => b.code === data.code && b.id !== data.id);
          if (clash) {
            error = "This branch code already exists.";
            return prev;
          }
        }

        const next = structuredClone(prev);
        const list = next[type] as RecordLike[];
        if (isEdit) {
          const idx = list.findIndex((x) => x.id === data.id);
          if (idx >= 0) {
            const oldName = String(list[idx]["name"] || "");
            list[idx] = { ...list[idx], ...data };
            if (type === "branches" && oldName !== data["name"]) {
              next.users.forEach((u) => {
                if (u.branch === oldName) u.branch = String(data["name"]);
              });
            }
          }
          auditInto(next, "Record updated", `${type}: ${data.id}`, currentUser || "Master Admin");
        } else {
          const created: RecordLike = { ...data, id: uid(PREFIX[type]) };
          if (type === "users") {
            (created as UserRecord).userId = genUserId(String(created["name"] ?? ""), null);
            (created as UserRecord).empCode = genEmpCode(String(created["branch"] ?? ""), null);
          }
          (next[type] as RecordLike[]).unshift(created);
          auditInto(next, "Record created", `${type}: ${created.id}`, currentUser || "Master Admin");
        }
        persistDb(next);
        return next;
      });

      if (error) return error;
      showToast(isEdit ? "Record updated" : "Record created");
      return null;
    },
    [auditInto, currentUser, genEmpCode, genUserId, persistDb, showToast],
  );

  const removeRecord = useCallback(
    (type: CollectionKey, id: string) => {
      if (!window.confirm("Delete this record from the local demo database?")) return;
      setDb((prev) => {
        const next = structuredClone(prev);
        (next[type] as RecordLike[]) = (next[type] as RecordLike[]).filter((x) => x.id !== id);
        auditInto(next, "Record deleted", `${type}: ${id}`, currentUser || "Master Admin");
        persistDb(next);
        return next;
      });
      showToast("Record deleted");
    },
    [auditInto, currentUser, persistDb, showToast],
  );

  const exportJson = useCallback(() => {
    downloadText(JSON.stringify(db, null, 2), "canadian-pharmacy-os-demo-backup.json", "application/json");
    showToast("JSON backup downloaded");
  }, [db, showToast]);

  const exportCsv = useCallback(
    (type: CollectionKey) => {
      const rows = db[type] as RecordLike[];
      if (!rows.length) {
        showToast("No records to export");
        return;
      }
      const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      downloadText(csv, `${type}-export.csv`, "text/csv");
      showToast("CSV exported");
    },
    [db, showToast],
  );

  const scopedRecords = useCallback(
    <T extends CollectionKey>(type: T): Database[T] => {
      const all = db[type];
      if (type !== "users" || !selectedBranches) return all;
      return (all as UserRecord[]).filter((u) => selectedBranches.includes(u.branch)) as Database[T];
    },
    [db, selectedBranches],
  );

  const value = useMemo<PharmacyContextValue>(
    () => ({
      ready,
      db,
      currentUser,
      toast,
      selectedBranches,
      showToast,
      login,
      verifyCredentials,
      completeLogin,
      register,
      logout,
      setSelectedBranches,
      saveCompany,
      upsertRecord,
      removeRecord,
      exportJson,
      exportCsv,
      companyCode,
      branchNames,
      genUserId,
      genEmpCode,
      scopedRecords,
    }),
    [
      ready,
      db,
      currentUser,
      toast,
      selectedBranches,
      showToast,
      login,
      verifyCredentials,
      completeLogin,
      register,
      logout,
      setSelectedBranches,
      saveCompany,
      upsertRecord,
      removeRecord,
      exportJson,
      exportCsv,
      companyCode,
      branchNames,
      genUserId,
      genEmpCode,
      scopedRecords,
    ],
  );

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used within PharmacyProvider");
  return ctx;
}

export type { BranchRecord };

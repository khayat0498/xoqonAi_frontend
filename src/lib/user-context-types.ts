export type UserRole = "teacher" | "student" | "admin" | "direktor" | "xodim";

export type Tenant = {
  id: string;
  name: string;
  status: "pending" | "active" | "rejected" | "suspended";
  inviteCode?: string;
  balanceUzs?: number;
};

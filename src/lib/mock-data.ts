export type UserRole = "student" | "teacher";

export type Student = {
  id: string;
  name: string;
  submissionCount: number;
  averageGrade?: number;
  telegramId?: string;
};

export type ClassItem = {
  id: string;
  name: string;
  icon?: string;
  studentIds: string[];
  studentCount: number;
  lastActivity: string;
  telegramGroupId?: string;
};

export type PlanType = "free" | "pro" | "premium" | "enterprise";

export type Plan = {
  key: PlanType;
  name: string;
  limit: number;
  originalLimit: number;
  maxStudentsPerClass: number;
  maxClasses: number;
  hasTelegram: boolean;
  priceMonthly: number;
  priceYearly: number;
  price: string;
  priceYear: string;
  features: string[];
};

export const plans: Plan[] = [
  { key: "free",       name: "Bepul",      limit: 60,   originalLimit: 30,   maxStudentsPerClass: 10,  maxClasses: 1,  hasTelegram: false, priceMonthly: 0,      priceYearly: 0,        price: "Bepul",            priceYear: "Bepul",              features: ["60 ta rasm/oy", "Asosiy AI tahlil", "1 ta sinf", "Sinfga 10 o'quvchi"] },
  { key: "pro",        name: "Pro",        limit: 400,  originalLimit: 200,  maxStudentsPerClass: 20,  maxClasses: 5,  hasTelegram: true,  priceMonthly: 49000,  priceYearly: 490000,   price: "49,000 so'm/oy",   priceYear: "490,000 so'm/yil",   features: ["400 ta rasm/oy", "Kengaytirilgan tahlil", "5 ta sinf", "Sinfga 20 o'quvchi", "Telegram bot"] },
  { key: "premium",    name: "Premium",    limit: 2000, originalLimit: 1000, maxStudentsPerClass: 30,  maxClasses: 0,  hasTelegram: true,  priceMonthly: 149000, priceYearly: 1490000,  price: "149,000 so'm/oy",  priceYear: "1,490,000 so'm/yil", features: ["2000 ta rasm/oy", "To'liq AI tahlil", "Cheksiz sinf", "Sinfga 30 o'quvchi", "Telegram bot", "Eksport"] },
  { key: "enterprise", name: "Enterprise", limit: 0,    originalLimit: 0,    maxStudentsPerClass: 0,   maxClasses: 0,  hasTelegram: true,  priceMonthly: 0,      priceYearly: 0,        price: "Kelishiladi",      priceYear: "Kelishiladi",        features: ["Cheksiz rasm", "Maxsus AI model", "API kirish", "Cheksiz sinf va o'quvchi", "Shaxsiy qo'llab-quvvatlash"] },
];

/* ── Folder / File system ──────────────────────────── */

export type Folder = {
  id: string;
  name: string;
  type: "auto" | "custom";
  icon?: string;
  color?: string;
  fileIds: string[];
  createdAt: string;
};

export type FileItem = {
  id: string;
  studentName: string;
  subject: string;
  grade: string;
  date: string;
  folderId: string;
  submissionId?: string;
};

export const SINFLAR_FOLDER_ID = "__sinflar__";

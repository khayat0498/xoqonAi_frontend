export type UserRole = "student" | "teacher";

export type Student = {
  id: string;
  name: string;
  submissionCount: number;
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

export const currentUser = {
  id: "1",
  name: "Abdulloh Karimov",
  role: "teacher" as UserRole,
  avatar: null,
};

export const folders = [
  { id: "1", name: "Matematika", icon: "📐", count: 12, color: "#EEF2FF" },
  { id: "2", name: "Ona tili", icon: "📖", count: 8, color: "#F0FDF4" },
  { id: "3", name: "Fizika", icon: "🔬", count: 5, color: "#FFF7ED" },
  { id: "4", name: "IELTS", icon: "🌍", count: 3, color: "#FFF1F2" },
];

export const classes: ClassItem[] = [
  { id: "1", name: "9-A",  studentIds: ["1","2","3"], studentCount: 3, lastActivity: "Bugun" },
  { id: "2", name: "9-B",  studentIds: ["4","5"],     studentCount: 2, lastActivity: "Kecha" },
  { id: "3", name: "10-A", studentIds: ["6","7"],     studentCount: 2, lastActivity: "2 kun oldin" },
  { id: "4", name: "10-B", studentIds: ["8"],         studentCount: 1, lastActivity: "3 kun oldin" },
];

export const students: Student[] = [
  { id: "1", name: "Ali Valiyev",         submissionCount: 5 },
  { id: "2", name: "Barno Hasanova",      submissionCount: 3 },
  { id: "3", name: "Dilshod Rahimov",     submissionCount: 7 },
  { id: "4", name: "Malika Yusupova",     submissionCount: 4 },
  { id: "5", name: "Jasur Toshmatov",     submissionCount: 6 },
  { id: "6", name: "Nilufar Ergasheva",   submissionCount: 2 },
  { id: "7", name: "Sherzod Nazarov",     submissionCount: 8 },
  { id: "8", name: "Zulfiya Abdullayeva", submissionCount: 1 },
];

export const submissions = [
  {
    id: "1",
    studentName: "Ali Valiyev",
    subject: "Matematika",
    date: "24 Fevral 2026",
    grade: "4/5",
    errorCount: 3,
    imageUrl: null,
    analysis: {
      grade: "4",
      maxGrade: "5",
      errors: [
        { title: "3-masalada hisob xatosi", description: "Ko'paytirish amalida noto'g'ri natija chiqarilgan" },
        { title: "5-masala to'liq emas", description: "Oxirgi qadamlar yozilmagan" },
        { title: "Birlik ko'rsatilmagan", description: "Javobda o'lchov birligi yozilmagan" },
      ],
      comment: "Umumiy ish yaxshi. Asosiy tushunchalar o'zlashtirilgan, lekin hisoblash xatolariga e'tibor berish kerak.",
    },
  },
];

export const chatMessages = [
  { id: "1", role: "assistant" as const, content: "Salom! Tahlil bilan tanishdingizmi? Qaysi qismni batafsil tushuntirishimni xohlaysiz?", time: "14:32" },
  { id: "2", role: "user" as const, content: "3-masalani tushuntir", time: "14:33" },
  { id: "3", role: "assistant" as const, content: "Albatta! 3-masalada ko'paytirish amali bajarilgan, lekin 4 × 7 = 28 bo'lishi kerak edi, lekin 24 deb yozilgan.", time: "14:33" },
];

import { students as defaultStudents, classes as defaultClasses } from "./mock-data";
import type { Student, ClassItem } from "./mock-data";

export type { Student, ClassItem };

const STUDENTS_KEY = "xoqon_students";
const CLASSES_KEY  = "xoqon_classes";

/* ── Students ─────────────────────────────────────────── */

export function loadStudents(): Student[] {
  if (typeof window === "undefined") return defaultStudents;
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    if (!saved) return defaultStudents;
    // Migration: strip old classId / number fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(saved) as any[]).map(({ classId: _c, number: _n, ...rest }) => rest as Student);
  } catch {
    return defaultStudents;
  }
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

/* ── Classes ──────────────────────────────────────────── */

export function loadClasses(): ClassItem[] {
  if (typeof window === "undefined") return defaultClasses;
  try {
    const savedClasses  = localStorage.getItem(CLASSES_KEY);
    const savedStudents = localStorage.getItem(STUDENTS_KEY);
    if (!savedClasses) return defaultClasses;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(savedClasses);

    // Migration: eski formatda studentIds yo'q bo'lsa, classId orqali qurish
    const needsMigration = parsed.some((c) => !Array.isArray(c.studentIds));
    if (needsMigration && savedStudents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oldStudents: any[] = JSON.parse(savedStudents);
      return parsed.map((c) => {
        const studentIds: string[] = c.studentIds ?? oldStudents
          .filter((s) => s.classId === c.id)
          .map((s) => String(s.id));
        return { ...c, studentIds, studentCount: studentIds.length } as ClassItem;
      });
    }

    return parsed.map((c) => ({
      ...c,
      studentIds: c.studentIds ?? [],
      studentCount: c.studentIds?.length ?? c.studentCount ?? 0,
    })) as ClassItem[];
  } catch {
    return defaultClasses;
  }
}

export function saveClasses(classes: ClassItem[]) {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

/* ── Class ↔ Student helpers (n2n) ───────────────────── */

/** Sinfga o'quvchi qo'shish */
export function addStudentToClass(
  classes: ClassItem[],
  classId: string,
  studentId: string,
): ClassItem[] {
  return classes.map((c) => {
    if (c.id !== classId) return c;
    if (c.studentIds.includes(studentId)) return c;
    const studentIds = [...c.studentIds, studentId];
    return { ...c, studentIds, studentCount: studentIds.length };
  });
}

/** Sinfdan o'quvchini chiqarish (global o'chirish emas) */
export function removeStudentFromClass(
  classes: ClassItem[],
  classId: string,
  studentId: string,
): ClassItem[] {
  return classes.map((c) => {
    if (c.id !== classId) return c;
    const studentIds = c.studentIds.filter((id) => id !== studentId);
    return { ...c, studentIds, studentCount: studentIds.length };
  });
}

/** O'quvchi qaysi sinflarda borligini qaytaradi */
export function getStudentClasses(classes: ClassItem[], studentId: string): ClassItem[] {
  return classes.filter((c) => c.studentIds.includes(studentId));
}

/* ── Todos ────────────────────────────────────────── */

export type Todo = {
  id: string;
  classId: string;
  text: string;
  date: string; // YYYY-MM-DD
  done: boolean;
};

const TODOS_KEY = "xoqon_todos";

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(TODOS_KEY);
    return saved ? (JSON.parse(saved) as Todo[]) : [];
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

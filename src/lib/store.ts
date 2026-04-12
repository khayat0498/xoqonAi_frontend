import { SINFLAR_FOLDER_ID } from "./mock-data";
import type { Student, ClassItem, Folder, FileItem } from "./mock-data";

export type { Student, ClassItem, Folder, FileItem };
export { SINFLAR_FOLDER_ID };

const STUDENTS_KEY = "xoqon_students";
const CLASSES_KEY  = "xoqon_classes";

const defaultSinflarFolder: Folder = {
  id: SINFLAR_FOLDER_ID,
  name: "Sinflar",
  type: "auto",
  icon: "🏫",
  color: "#e8edf6",
  fileIds: [],
  createdAt: "2026-01-01",
};

/* ── Students ─────────────────────────────────────────── */

export function loadStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    if (!saved) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(saved) as any[]).map(({ classId: _c, number: _n, ...rest }) => {
      return { ...rest, averageGrade: rest.averageGrade ?? 0 } as Student;
    });
  } catch {
    return [];
  }
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

/* ── Classes ──────────────────────────────────────────── */

export function loadClasses(): ClassItem[] {
  if (typeof window === "undefined") return [];
  try {
    const savedClasses  = localStorage.getItem(CLASSES_KEY);
    const savedStudents = localStorage.getItem(STUDENTS_KEY);
    if (!savedClasses) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(savedClasses);

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
    return [];
  }
}

export function saveClasses(classes: ClassItem[]) {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

/* ── Class ↔ Student helpers (n2n) ───────────────────── */

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

export function getStudentClasses(classes: ClassItem[], studentId: string): ClassItem[] {
  return classes.filter((c) => c.studentIds.includes(studentId));
}

let _classId = Date.now();
export function createClass(name: string, icon?: string): ClassItem | null {
  const classes = loadClasses();
  const exists = classes.some(
    (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  if (exists) return null;
  const cls: ClassItem = {
    id: String(++_classId),
    name,
    icon: icon || "🏫",
    studentIds: [],
    studentCount: 0,
    lastActivity: "Hozir",
  };
  saveClasses([...classes, cls]);
  return cls;
}

export function deleteClass(classId: string) {
  const classes = loadClasses();
  saveClasses(classes.filter((c) => c.id !== classId));
}

export function renameClass(classId: string, newName: string, newIcon?: string): boolean {
  const classes = loadClasses();
  const exists = classes.some(
    (c) => c.id !== classId && c.name.toLowerCase().trim() === newName.toLowerCase().trim()
  );
  if (exists) return false;
  saveClasses(classes.map((c) => {
    if (c.id !== classId) return c;
    return { ...c, name: newName || c.name, ...(newIcon !== undefined ? { icon: newIcon } : {}) };
  }));
  return true;
}

/* ── Folders ──────────────────────────────────────── */

const FOLDERS_KEY = "xoqon_folders";
const FILES_KEY   = "xoqon_files";

export function loadFolders(): Folder[] {
  if (typeof window === "undefined") return [defaultSinflarFolder];
  try {
    const saved = localStorage.getItem(FOLDERS_KEY);
    if (!saved) return [defaultSinflarFolder];
    const parsed = JSON.parse(saved) as Folder[];
    if (!parsed.find((f) => f.id === SINFLAR_FOLDER_ID)) {
      parsed.unshift(defaultSinflarFolder);
    }
    return parsed;
  } catch {
    return [defaultSinflarFolder];
  }
}

export function saveFolders(folders: Folder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function loadFiles(): FileItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(FILES_KEY);
    return saved ? (JSON.parse(saved) as FileItem[]) : [];
  } catch {
    return [];
  }
}

export function saveFiles(files: FileItem[]) {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

export function folderNameExists(name: string, excludeId?: string): boolean {
  const folders = loadFolders();
  const lower = name.toLowerCase().trim();
  return folders.some((f) => f.id !== excludeId && f.name.toLowerCase().trim() === lower);
}

let _folderId = Date.now();
export function createFolder(name: string, icon?: string): Folder | null {
  if (folderNameExists(name)) return null;
  const folders = loadFolders();
  const folder: Folder = {
    id: String(++_folderId),
    name,
    type: "custom",
    icon: icon || "📁",
    fileIds: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveFolders([...folders, folder]);
  return folder;
}

export function renameFolder(folderId: string, newName: string, newIcon?: string): boolean {
  if (folderId === SINFLAR_FOLDER_ID) return false;
  if (folderNameExists(newName, folderId)) return false;
  const folders = loadFolders();
  saveFolders(folders.map((f) => {
    if (f.id !== folderId) return f;
    return { ...f, name: newName || f.name, ...(newIcon !== undefined ? { icon: newIcon } : {}) };
  }));
  return true;
}

export function updateFolderIcon(folderId: string, icon: string) {
  if (folderId === SINFLAR_FOLDER_ID) return;
  const folders = loadFolders();
  saveFolders(folders.map((f) => f.id === folderId ? { ...f, icon } : f));
}

export function deleteFolder(folderId: string) {
  if (folderId === SINFLAR_FOLDER_ID) return;
  const folders = loadFolders();
  const files = loadFiles();
  saveFolders(folders.filter((f) => f.id !== folderId));
  saveFiles(files.filter((f) => f.folderId !== folderId));
}

export function moveFile(fileId: string, targetFolderId: string) {
  const files = loadFiles();
  const folders = loadFolders();
  const file = files.find((f) => f.id === fileId);
  if (!file) return;

  const oldFolderId = file.folderId;
  const updatedFiles = files.map((f) =>
    f.id === fileId ? { ...f, folderId: targetFolderId } : f
  );
  const updatedFolders = folders.map((f) => {
    if (f.id === oldFolderId) return { ...f, fileIds: f.fileIds.filter((id) => id !== fileId) };
    if (f.id === targetFolderId) return { ...f, fileIds: [...f.fileIds, fileId] };
    return f;
  });
  saveFiles(updatedFiles);
  saveFolders(updatedFolders);
}

export function deleteFile(fileId: string) {
  const files = loadFiles();
  const folders = loadFolders();
  const file = files.find((f) => f.id === fileId);
  if (!file) return;
  saveFiles(files.filter((f) => f.id !== fileId));
  saveFolders(folders.map((f) =>
    f.id === file.folderId ? { ...f, fileIds: f.fileIds.filter((id) => id !== fileId) } : f
  ));
}

export function renameFile(fileId: string, newName: string) {
  const files = loadFiles();
  saveFiles(files.map((f) => f.id === fileId ? { ...f, studentName: newName } : f));
}

export function addFileToFolder(folderId: string, data: Omit<FileItem, "id" | "folderId">): FileItem {
  const files = loadFiles();
  const folders = loadFolders();
  const id = "f" + String(Date.now());
  const file: FileItem = { ...data, id, folderId };
  saveFiles([...files, file]);
  saveFolders(folders.map((f) =>
    f.id === folderId ? { ...f, fileIds: [...f.fileIds, id] } : f
  ));
  return file;
}

/* ── Todos ────────────────────────────────────────── */

export type Todo = {
  id: string;
  classId: string;
  text: string;
  date: string;
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

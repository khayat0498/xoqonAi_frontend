"use client";

import { useState } from "react";
import { X, Users, Check } from "lucide-react";
import type { Student, ClassItem } from "@/lib/store";

interface Props {
  student: Student;
  classes: ClassItem[];
  onSave: (toAdd: string[], toRemove: string[]) => void;
  onClose: () => void;
}

export default function TransferStudentModal({ student, classes, onSave, onClose }: Props) {
  const initialEnrolled = classes
    .filter((c) => c.studentIds.includes(student.id))
    .map((c) => c.id);

  const [enrolled, setEnrolled] = useState<Set<string>>(new Set(initialEnrolled));

  const toggle = (classId: string) => {
    setEnrolled((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const handleSave = () => {
    const toAdd = [...enrolled].filter((id) => !initialEnrolled.includes(id));
    const toRemove = initialEnrolled.filter((id) => !enrolled.has(id));
    onSave(toAdd, toRemove);
  };

  const changed =
    [...enrolled].some((id) => !initialEnrolled.includes(id)) ||
    initialEnrolled.some((id) => !enrolled.has(id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#00000060" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm overflow-hidden animate-fade-in"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Sinflarni boshqarish
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {student.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "var(--radius-sm)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Sinflar ro'yxati */}
        <div className="p-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {classes.map((cls) => {
            const isEnrolled = enrolled.has(cls.id);
            return (
              <button
                key={cls.id}
                onClick={() => toggle(cls.id)}
                className="flex items-center gap-3 px-4 py-3 text-left w-full transition-all"
                style={{
                  background: isEnrolled ? "var(--accent-light)" : "var(--bg-primary)",
                  border: `1px solid ${isEnrolled ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    background: isEnrolled ? "var(--accent)" : "var(--bg-card)",
                    color: isEnrolled ? "#fff" : "var(--accent)",
                    border: isEnrolled ? "none" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {cls.icon?.trim() || cls.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: isEnrolled ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    {cls.name} sinfi
                  </p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <Users size={10} /> {cls.studentCount} o'quvchi
                  </p>
                </div>

                {isEnrolled && (
                  <Check size={16} className="shrink-0" style={{ color: "var(--accent)" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={handleSave}
            disabled={!changed}
            className="w-full py-3 text-sm font-medium transition-all"
            style={{
              background: changed ? "var(--cta)" : "var(--border)",
              color: changed ? "#fff" : "var(--text-muted)",
              cursor: changed ? "pointer" : "default",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

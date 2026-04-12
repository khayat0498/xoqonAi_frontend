import { plans } from "./mock-data";
import type { PlanType } from "./mock-data";

export function getPlan(planKey: PlanType = "free") {
  return plans.find((p) => p.key === planKey) ?? plans[0];
}

export function canAddStudentToClass(currentStudentCount: number, planKey: PlanType = "free"): { allowed: boolean; message: string } {
  const plan = getPlan(planKey);
  if (plan.maxStudentsPerClass > 0 && currentStudentCount >= plan.maxStudentsPerClass) {
    return {
      allowed: false,
      message: `${plan.name} rejada sinfga maksimum ${plan.maxStudentsPerClass} ta o'quvchi qo'shish mumkin. Ko'proq qo'shish uchun tarifni yangilang.`,
    };
  }
  return { allowed: true, message: "" };
}

export function canAddClass(currentClassCount: number, planKey: PlanType = "free"): { allowed: boolean; message: string } {
  const plan = getPlan(planKey);
  if (plan.maxClasses > 0 && currentClassCount >= plan.maxClasses) {
    return {
      allowed: false,
      message: `${plan.name} rejada maksimum ${plan.maxClasses} ta sinf yaratish mumkin. Ko'proq yaratish uchun tarifni yangilang.`,
    };
  }
  return { allowed: true, message: "" };
}

export function canUseTelegram(planKey: PlanType = "free"): { allowed: boolean; message: string } {
  const plan = getPlan(planKey);
  if (!plan.hasTelegram) {
    return {
      allowed: false,
      message: `Telegram integratsiyasi faqat Pro va undan yuqori rejalarda mavjud. Tarifni yangilang.`,
    };
  }
  return { allowed: true, message: "" };
}

export function canCheckImage(used: number, planKey: PlanType = "free"): { allowed: boolean; message: string } {
  const plan = getPlan(planKey);
  if (plan.limit > 0 && used >= plan.limit) {
    return {
      allowed: false,
      message: `Oylik ${plan.limit} ta rasm limiti tugagan. Ko'proq tekshirish uchun tarifni yangilang.`,
    };
  }
  return { allowed: true, message: "" };
}

const TOKEN_KEY = "xoqon_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("xoqon_user_cache");
}

export type JwtPayload = {
  userId: string;
  email: string;
  role: "teacher" | "student" | "admin" | "direktor" | "xodim";
  tenantId?: string | null;
  exp: number;
  iat: number;
};

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
    const json = typeof window !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString();
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    return null;
  }
}

export function getJwtPayload(): JwtPayload | null {
  const token = getToken();
  return token ? decodeJwt(token) : null;
}

export async function getMe() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    removeToken();
    return null;
  }

  return res.json();
}

// Foydalanuvchi roli bo'yicha login keyin qayerga yo'naltirish kerak
export function landingForRole(role: string | undefined | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "direktor":
      return "/direktor";
    default:
      return "/home";
  }
}

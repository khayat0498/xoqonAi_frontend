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

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { UserProvider } from "@/lib/user-context";
import { UserWSProvider } from "@/lib/user-ws";
import { ThemeProvider } from "@/lib/theme-context";

export default function SubmissionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  return (
    <ThemeProvider>
      <UserProvider>
        <UserWSProvider>
          {children}
        </UserWSProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

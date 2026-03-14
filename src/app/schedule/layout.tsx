import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  );
}

"use client";

import { useSession } from "@/context/SessionContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPage from "@/app/login/page";
import { Loader2 } from "lucide-react";

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-app-bg text-text-primary">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Bypass login protection for onboarding page
  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  if (!currentUser && pathname !== "/login") {
    return <LoginPage />;
  }

  return <>{children}</>;
}

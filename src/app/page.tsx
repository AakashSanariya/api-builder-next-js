"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/forms");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-bold text-gray-400">
      Redirecting to dashboard...
    </div>
  );
}

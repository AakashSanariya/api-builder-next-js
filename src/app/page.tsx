"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/forms");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-card">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="text-primary w-9 h-9 md:w-12 md:h-12" />
      </motion.div>
    </div>
  );
}

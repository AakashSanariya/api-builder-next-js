"use client";

import React, { ReactNode } from "react";
import { PopupProvider } from "./PopupContext";
import { AuthProvider } from "./AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PopupProvider>
        {children}
      </PopupProvider>
    </AuthProvider>
  );
}

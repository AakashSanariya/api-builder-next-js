"use client";

import React, { ReactNode } from "react";
import { PopupProvider } from "./PopupContext";
import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PopupProvider>
          {children}
        </PopupProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

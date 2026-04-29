"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import Button from "../components/common/Button";

type PopupType = "alert" | "confirm" | "prompt";

interface PopupOptions {
  title: string;
  message: string;
  type?: PopupType;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

interface PopupContextType {
  showPopup: (options: PopupOptions) => Promise<any>;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PopupOptions | null>(null);
  const [inputValue, setInputValue] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resolvePromise, setResolvePromise] = useState<(value: any) => void>();

  const showPopup = (opts: PopupOptions) => {
    return new Promise<any>((resolve) => {
      setOptions({ type: "alert", confirmText: "Submit", cancelText: "Cancel", ...opts });
      setInputValue(opts.defaultValue || "");
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (options?.type === "prompt") {
      resolvePromise?.(inputValue);
    } else {
      resolvePromise?.(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (options?.type === "prompt") {
      resolvePromise?.(null);
    } else {
      resolvePromise?.(false);
    }
  };

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${options.type === 'confirm' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    {options.type === 'confirm' ? <AlertTriangle size={24} /> : <Info size={24} />}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{options.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{options.message}</p>
                    
                    {options.type === "prompt" && (
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirm();
                          if (e.key === 'Escape') handleCancel();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
                {options.type !== "alert" && (
                  <Button variant="outline" size="sm" onClick={handleCancel} className="bg-white border-gray-200">
                    {options.cancelText}
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={handleConfirm} className={options.type === 'confirm' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/20 shadow-red-500/10' : ''}>
                  {options.confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) throw new Error("usePopup must be used within PopupProvider");
  return context;
};

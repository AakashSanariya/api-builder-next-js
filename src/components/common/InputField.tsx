"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, className = "", ...props }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2 w-full ${className}`}
    >
      <div className="flex justify-between items-end px-1">
        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.1em] font-display">
          {label}
          {props.required && <span className="text-indigo-500 ml-1 font-bold text-lg leading-none">*</span>}
        </label>
      </div>

      <div className="relative group">
        <input
          className={`w-full h-14 px-6 rounded-[1.25rem] border-2 bg-white transition-all duration-300 outline-none font-medium text-gray-700
            ${error 
              ? "border-red-100 focus:border-red-500 focus:shadow-[0_0_20px_rgb(239,68,68,0.1)]" 
              : "border-gray-50 group-hover:border-gray-200 focus:border-indigo-600 focus:shadow-[0_10px_30px_rgb(79,70,229,0.08)] bg-gray-50/30 focus:bg-white"
            }
            placeholder:text-gray-300 placeholder:font-normal`}
          {...props}
        />
        
        {/* Subtle decorative ring on focus handled by shadow in the class above */}
      </div>

      <AnimatePresence>
        {error && (
          <motion.span 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] font-bold text-red-500 px-2 flex items-center gap-1 mt-1 font-display"
          >
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InputField;

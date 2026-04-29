"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  type = "button",
  onClick,
  ...rest
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:pointer-events-none overflow-hidden cursor-pointer select-none";
  
  const variants = {
    primary:   "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.4)] hover:-translate-y-0.5",
    secondary: "bg-gray-900 text-white hover:bg-black shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
    outline:   "bg-white border-2 border-gray-100 text-gray-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/30",
    danger:    "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_8px_30px_rgba(239,68,68,0.3)]",
    glass:     "bg-white/10 backdrop-blur-md border-2 border-gray-100 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/20",
  };

  const sizes = {
    sm: "h-10 px-5 text-xs rounded-2xl",
    md: "h-12 px-8 text-sm rounded-[1.25rem]",
    lg: "h-16 px-10 text-base rounded-[1.5rem]",
  };

  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className="inline-flex"
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin shrink-0" size={16} />
            <span>Processing</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 leading-none">
            {children}
          </span>
        )}

        {/* Subtle shine sweep */}
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      </button>
    </motion.div>
  );
};

export default Button;

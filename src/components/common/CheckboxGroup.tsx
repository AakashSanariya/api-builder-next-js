"use client";
 
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { FieldOption } from "../../types/field.types";
 
interface CheckboxGroupProps {
  label: string;
  name: string;
  options: FieldOption[];
  value: any[];
  onChange: (value: any[]) => void;
  error?: string;
  required?: boolean;
}
 
const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  name,
  options,
  value = [],
  onChange,
  error,
  required,
}) => {
  const toggleOption = (optValue: any) => {
    const newValue = value.some(v => String(v) === String(optValue))
      ? value.filter(v => String(v) !== String(optValue))
      : [...value, optValue];
    onChange(newValue);
  };
 
  return (
    <div className="flex flex-col gap-2 md:gap-3 w-full">
      <div className="flex justify-between items-end px-1">
        <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.1em] font-display">
          {label}
          {required && <span className="text-indigo-500 ml-1 font-bold text-base md:text-lg leading-none">*</span>}
        </label>
      </div>
 
      <div className="grid grid-cols-1 gap-2 md:gap-3">
        {options.map((option, idx) => {
          const optionValue = option.id || option.value;
          const isChecked = value.some(v => String(v) === String(optionValue));
          return (
            <motion.label
              key={String(optionValue)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group touch-manipulation
                ${isChecked
                  ? "border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50 ring-4 ring-indigo-50"
                  : "border-gray-50 bg-gray-50/30 hover:border-gray-200 hover:bg-white"
                }`}
            >
              <input
                type="checkbox"
                name={name}
                checked={isChecked}
                onChange={() => toggleOption(optionValue)}
                className="hidden"
              />
              
              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0
                ${isChecked ? "border-indigo-600 bg-indigo-600 scale-110" : "border-gray-300 bg-white group-hover:border-indigo-300"}`}
              >
                <AnimatePresence>
                  {isChecked && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                    >
                      <Check size={12} className="text-white" strokeWidth={4} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isChecked ? "text-indigo-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                {option.label}
              </span>
 
              {/* Decorative gradient */}
              {isChecked && (
                <div className="absolute right-[-10%] bottom-[-50%] w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              )}
            </motion.label>
          );
        })}
      </div>
      {error && <span className="text-[10px] md:text-[11px] font-bold text-red-500 px-2 mt-1">{error}</span>}
    </div>
  );
};
 
export default CheckboxGroup;

"use client";
 
import React from "react";
import { motion } from "framer-motion";
import { FieldOption } from "../../types/field.types";
 
interface RadioGroupProps {
  label: string;
  name: string;
  options: FieldOption[];
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
}
 
const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
}) => {
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
          const isSelected = String(value) === String(optionValue);
          return (
            <motion.label
              key={String(optionValue)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group touch-manipulation
                ${isSelected
                  ? "border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50 ring-4 ring-indigo-50"
                  : "border-gray-50 bg-gray-50/30 hover:border-gray-200 hover:bg-white"
                }`}
            >
              <input
                type="radio"
                name={name}
                value={String(optionValue)}
                checked={isSelected}
                onChange={() => onChange(optionValue)}
                className="hidden"
              />
              
              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0
                ${isSelected ? "border-indigo-600 scale-110" : "border-gray-300 bg-white group-hover:border-indigo-300"}`}
              >
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-indigo-600 shadow-[0_0_10px_rgb(79,70,229,0.5)]" 
                  />
                )}
              </div>
              
              <span className={`text-sm md:text-sm font-bold tracking-tight transition-colors duration-300 ${isSelected ? "text-indigo-900" : "text-gray-600 group-hover:text-gray-900"}`}>
                {option.label}
              </span>
 
              {/* Background gradient on selection */}
              {isSelected && (
                <div className="absolute right-[-10%] top-[-50%] w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              )}
            </motion.label>
          );
        })}
      </div>
      {error && <span className="text-[10px] md:text-[11px] font-bold text-red-500 px-2 mt-1">{error}</span>}
    </div>
  );
};
 
export default RadioGroup;

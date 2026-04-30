"use client";

import React from "react";
import { motion } from "framer-motion";
import { useBuilderStore } from "../../store/useBuilderStore";
import { FieldType } from "../../types/field.types";
import { 
  Type, 
  AlignLeft, 
  CheckSquare, 
  CircleDot, 
  Upload, 
  MousePointer2, 
  Link as LinkIcon,
  Zap,
  Box,
  ChevronDown
} from "lucide-react";

interface FieldTemplate {
  type: FieldType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const FIELD_TEMPLATES: FieldTemplate[] = [
  { type: "input", label: "Text Field", icon: Type, description: "Single line user input" },
  { type: "textarea", label: "Large Text", icon: AlignLeft, description: "Multi-line text area" },
  { type: "radio", label: "Single Select", icon: CircleDot, description: "One choice from many" },
  { type: "select", label: "Dropdown", icon: ChevronDown, description: "Compact choice list" },
  { type: "checkbox", label: "Multi Select", icon: CheckSquare, description: "Multiple choice options" },
  { type: "file", label: "File Upload", icon: Upload, description: "Assets and documents" },
  { type: "button", label: "Action Button", icon: MousePointer2, description: "External trigger" },
  { type: "link", label: "Hyperlink", icon: LinkIcon, description: "Reference navigation" },
];

const BuilderSidebar = () => {
  const addField = useBuilderStore((state) => state.addField);
  const addSection = useBuilderStore((state) => state.addSection);

  return (
    <aside className="w-[320px] bg-white border-r h-full flex flex-col shrink-0 z-20 overflow-hidden relative">
      <div className="p-6 md:p-8 border-b bg-white relative z-10">
        <h2 className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
            <Zap size={12} className="" /> Design System
        </h2>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 font-display tracking-tight leading-none mb-1">
            API Builder
        </h1>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wide">
            Drag components to your canvas
        </p>
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6">
        <button
          onClick={() => addSection()}
          className="w-full py-3 md:py-4 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-100"
        >
          <Box size={14} className="" />
          <span className="hidden sm:inline">New Module Section</span>
          <span className="sm:hidden">New Module</span>
        </button>
      </div>
       
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-3 md:pt-4 space-y-3 md:space-y-4 custom-scrollbar bg-gray-50/10">
        {FIELD_TEMPLATES.map((template, idx) => (
          <motion.button
            key={template.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addField(template.type)}
            className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-300 group text-left relative overflow-hidden"
          >
            <div className="p-2.5 md:p-3.5 rounded-xl md:rounded-2xl bg-gray-50 group-hover:bg-indigo-50 text-gray-400 group-hover:text-indigo-600 transition-colors border border-gray-50 group-hover:border-indigo-100 shadow-sm shrink-0">
              <template.icon size={18} className="" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-black text-gray-800 group-hover:text-gray-900 transition-colors font-display">
                {template.label}
              </span>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tight group-hover:text-indigo-400 transition-colors truncate block">
                {template.description}
              </span>
            </div>

            {/* Decorative background circle */}
            <div className="absolute right-[-20%] top-[-20%] w-16 h-16 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-full blur-2xl transition-colors" />
          </motion.button>
        ))}
      </div>

      <div className="p-4 md:p-6 border-t bg-gray-50/20">
        <div className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 flex flex-col gap-2 md:gap-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-white/90">
             <Box size={14} className="text-white shrink-0" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Pro Tip</span>
          </div>
          <p className="text-[10px] md:text-[11px] text-indigo-50 font-bold leading-relaxed pr-2">
            Every component you add becomes a manageable field in your unified JSON API schema.
          </p>
          
          {/* Decorative shine */}
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>
    </aside>
  );
};

export default BuilderSidebar;

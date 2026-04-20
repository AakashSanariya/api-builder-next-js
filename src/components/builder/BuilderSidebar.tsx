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
  Box
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
  { type: "checkbox", label: "Multi Select", icon: CheckSquare, description: "Multiple choice options" },
  { type: "file", label: "File Upload", icon: Upload, description: "Assets and documents" },
  { type: "button", label: "Action Button", icon: MousePointer2, description: "External trigger" },
  { type: "link", label: "Hyperlink", icon: LinkIcon, description: "Reference navigation" },
];

const BuilderSidebar = () => {
  const addField = useBuilderStore((state) => state.addField);

  return (
    <aside className="w-[320px] bg-white border-r h-full flex flex-col shrink-0 z-20 overflow-hidden relative">
      <div className="p-8 border-b bg-white relative z-10">
        <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
            <Zap size={14} /> Design System
        </h2>
        <h1 className="text-2xl font-black text-gray-900 font-display tracking-tight leading-none mb-1">
            API Builder
        </h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
            Drag components to your canvas
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/10">
        {FIELD_TEMPLATES.map((template, idx) => (
          <motion.button
            key={template.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addField(template.type)}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-300 group text-left relative overflow-hidden"
          >
            <div className="p-3.5 rounded-2xl bg-gray-50 group-hover:bg-indigo-50 text-gray-400 group-hover:text-indigo-600 transition-colors border border-gray-50 group-hover:border-indigo-100 shadow-sm">
              <template.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-black text-gray-800 group-hover:text-gray-900 transition-colors font-display">
                {template.label}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight group-hover:text-indigo-400 transition-colors truncate block">
                {template.description}
              </span>
            </div>

            {/* Decorative background circle */}
            <div className="absolute right-[-20%] top-[-20%] w-16 h-16 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-full blur-2xl transition-colors" />
          </motion.button>
        ))}
      </div>

      <div className="p-6 border-t bg-gray-50/20">
        <div className="p-5 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-white/90">
             <Box size={18} className="text-white shrink-0" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Pro Tip</span>
          </div>
          <p className="text-[11px] text-indigo-50 font-bold leading-relaxed pr-2">
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

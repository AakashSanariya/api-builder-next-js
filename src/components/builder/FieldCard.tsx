"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { FieldSchema } from "../../types/field.types";
import FieldRenderer from "../renderer/FieldRenderer";
import { useBuilderStore } from "../../store/useBuilderStore";
import { Trash2, GripVertical, Settings2, Code, Layout } from "lucide-react";
import { usePopup } from "../../contexts/PopupContext";

interface FieldCardProps {
  field: FieldSchema;
}

const FieldCard: React.FC<FieldCardProps> = ({ field }) => {
  const selectedField = useBuilderStore((state) => state.selectedField);
  const setSelectedField = useBuilderStore((state) => state.setSelectedField);
  const deleteField = useBuilderStore((state) => state.deleteField);
  const { showPopup } = usePopup();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const isSelected = selectedField?.id === field.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedField(field);
      }}
      className={`group relative mb-4 md:mb-8 bg-white border-2 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-500 cursor-pointer premium-shadow w-full max-w-full overflow-hidden
        ${isDragging ? "opacity-40 scale-95 shadow-2xl border-indigo-200 z-50 ring-4 md:ring-8 ring-indigo-50/50" : ""}
        ${isSelected
          ? "border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 md:ring-8 ring-indigo-50/50 -translate-y-0.5 md:-translate-y-1"
          : "border-transparent hover:border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-0.5"
        }`}
    >
      {/* Drag Handle - Hidden on Mobile */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-[-8px] md:left-[-18px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 md:p-3 bg-white border border-gray-50 rounded-lg md:rounded-2xl shadow-2xl shadow-black/10 cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-600 transition-all z-20 hidden md:block"
      >
        <GripVertical size={16} className="" />
      </div>

      <div className="p-4 md:p-8">
          {/* Field Identification Header */}
          <div className="flex items-center justify-between mb-4 md:mb-8 pb-3 md:pb-4 border-b border-gray-50 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Layout size={16} className="md:hidden" />
                    <Layout size={20} className="hidden md:block" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5 leading-none truncate">
                        {field.type.toUpperCase()}
                    </h4>
                    <span className="text-xs md:text-sm font-black text-gray-900 font-display truncate block">
                        {field.name || 'Unnamed'}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField(field);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all"
                    title="Edit settings"
                >
                    <Settings2 size={14} className="" />
                </button>
                <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await showPopup({
                        type: "confirm",
                        title: "Confirm Deletion",
                        message: "Are you sure you want to delete this field?",
                        confirmText: "Delete",
                        cancelText: "Cancel"
                      });
                      if(confirmed) deleteField(field.id);
                    }}
                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all"
                    title="Delete field"
                >
                    <Trash2 size={14} className="" />
                </button>
            </div>
          </div>

          {/* Field Preview (Non-interactive) */}
          <div className="pointer-events-none select-none px-1 md:px-2 transform transition-transform group-hover:scale-[1.01] duration-500 overflow-x-hidden">
            <div className="overflow-x-auto max-w-full">
            <FieldRenderer
              field={field}
              value={null}
              onChange={() => {}}
            />
            </div>
          </div>

          {/* Validation Indicators */}
          {field.validations?.required && (
              <div className="mt-4 md:mt-6 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                 <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Required</span>
              </div>
          )}
      </div>
    </div>
  );
};

export default FieldCard;

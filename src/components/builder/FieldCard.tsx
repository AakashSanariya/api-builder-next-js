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
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      onClick={(e) => {
        e.stopPropagation();
        setSelectedField(field);
      }}
      className={`group relative mb-8 bg-white border-2 rounded-[2.5rem] transition-all duration-500 cursor-pointer premium-shadow
        ${isDragging ? "opacity-40 scale-95 shadow-2xl border-indigo-200 z-50 ring-8 ring-indigo-50/50" : ""}
        ${isSelected
          ? "border-indigo-600 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50/50 -translate-y-1"
          : "border-transparent hover:border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-0.5"
        }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-[-18px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-3 bg-white border border-gray-50 rounded-2xl shadow-2xl shadow-black/10 cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-600 transition-all z-20"
      >
        <GripVertical size={24} />
      </div>

      <div className="p-8">
          {/* Field Identification Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layout size={20} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5 leading-none">
                        Component Type
                    </h4>
                    <span className="text-sm font-black text-gray-900 font-display">
                        {field.type.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-400">
                    <Code size={12} className="text-gray-300" />
                    <span className="text-[10px] font-mono font-bold tracking-tight">
                        key: {field.name}
                    </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField(field);
                    }}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit settings"
                >
                    <Settings2 size={18} />
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
                    className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete field"
                >
                    <Trash2 size={18} />
                </button>
                </div>
            </div>
          </div>

          {/* Field Preview (Non-interactive) */}
          <div className="pointer-events-none select-none px-2 transform transition-transform group-hover:scale-[1.01] duration-500">
            <FieldRenderer
              field={field}
              value={null}
              onChange={() => {}}
            />
          </div>

          {/* Validation Indicators */}
          {field.validations?.required && (
              <div className="mt-6 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Required Parameter</span>
              </div>
          )}
      </div>
    </motion.div>
  );
};

export default FieldCard;

"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { useBuilderStore } from "../../store/useBuilderStore";
import FieldCard from "./FieldCard";
import { Layout, PlusCircle, Sparkles } from "lucide-react";

const BuilderCanvas = () => {
  const fields = useBuilderStore((state) => state.fields);
  const reorderFields = useBuilderStore((state) => state.reorderFields);
  const setSelectedField = useBuilderStore((state) => state.setSelectedField);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(active.id as string, over.id as string);
    }
  };

  return (
    <main 
        className="flex-1 overflow-y-auto bg-gray-50/30 p-16 custom-scrollbar relative canvas-dot-grid h-full"
        onClick={() => setSelectedField(null)}
    >
      <div className="max-w-3xl mx-auto min-h-full pb-32">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
                {fields.map((field) => (
                    <FieldCard key={field.id} field={field} />
                ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {fields.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-40 border-4 border-dashed border-gray-100 rounded-[4rem] flex flex-col items-center justify-center text-center px-12 bg-white/50 backdrop-blur-sm"
          >
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-indigo-600 shadow-2xl shadow-indigo-200 text-white rounded-[2rem] flex items-center justify-center relative z-10 rotate-3">
                    <PlusCircle size={44} strokeWidth={1.5} />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-3xl flex items-center justify-center text-white shadow-lg z-20 -rotate-12">
                    <Sparkles size={24} />
                </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4 font-display">
                Create something amazing
            </h2>
            <p className="text-gray-400 max-w-sm leading-relaxed font-bold uppercase text-[10px] tracking-[0.2em]">
                Drag your first component to the workspace to initialize the API schema engine.
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {fields.length > 0 && (
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-gray-900/90 backdrop-blur-xl text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-4 text-xs font-black tracking-[0.2em] uppercase z-40"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgb(34,197,94)]" />
                <span>Live Workspace</span>
                <span className="w-px h-4 bg-white/20 mx-1" />
                <span className="text-indigo-400">{fields.length} Fields Active</span>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default BuilderCanvas;

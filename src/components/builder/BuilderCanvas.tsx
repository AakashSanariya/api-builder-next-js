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
import { usePopup } from "../../contexts/PopupContext";
import { useBuilderStore } from "../../store/useBuilderStore";
import FieldCard from "./FieldCard";
import { Layout, PlusCircle, Sparkles } from "lucide-react";

const BuilderCanvas = () => {
  const sections = useBuilderStore((state) => state.sections);
  const activeSectionId = useBuilderStore((state) => state.activeSectionId);
  const setActiveSection = useBuilderStore((state) => state.setActiveSection);
  const addSection = useBuilderStore((state) => state.addSection);
  const updateSection = useBuilderStore((state) => state.updateSection);
  const deleteSection = useBuilderStore((state) => state.deleteSection);
  const reorderFields = useBuilderStore((state) => state.reorderFields);
  const setSelectedField = useBuilderStore((state) => state.setSelectedField);
  const { showPopup } = usePopup();

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

  const handleDragEnd = (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(sectionId, active.id as string, over.id as string);
    }
  };

  return (
    <main 
        className="flex-1 overflow-y-auto bg-muted/30 p-3 md:p-6 lg:p-16 custom-scrollbar relative canvas-dot-grid h-full w-full max-w-full overflow-x-hidden"
        onClick={() => {
          setSelectedField(null);
          setActiveSection(null);
        }}
    >
      <div className="w-full md:max-w-3xl mx-auto min-h-full pb-32 space-y-8 md:space-y-20 px-1 md:px-0 overflow-x-hidden max-w-full box-border">
        {sections.map((section, idx) => {
          const isActive = activeSectionId === section.id;
          return (
            <section 
              key={section.id} 
              onClick={(e) => {
                e.stopPropagation();
                setActiveSection(section.id);
              }}
              className={`space-y-4 md:space-y-8 relative group/section p-3 md:p-8 rounded-[1.5rem] md:rounded-[4rem] bg-card transition-all duration-500 border w-full max-w-full overflow-x-hidden
                ${isActive 
                  ? "shadow-2xl shadow-primary/20 ring-4 md:ring-8 ring-primary/10 border-primary scale-[1.01] md:scale-[1.02]" 
                  : "shadow-[0_20px_50px_rgba(0,0,0,0.02)] border-border/50 hover:border-border"
                }`}
            >
            <div className="flex items-center justify-between px-1 md:px-2">
              <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1 overflow-hidden">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-foreground text-white flex items-center justify-center font-black text-xs shadow-xl shadow-gray-200 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1 overflow-hidden">
                  <span className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-[0.3em] truncate">Module Entity</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="Untitled Section"
                    className="bg-transparent text-lg md:text-2xl font-black text-foreground font-display tracking-tight outline-none border-b-2 border-transparent focus:border-primary transition-all py-1 w-full min-w-0 uppercase truncate"
                  />
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await showPopup({
                    type: "confirm",
                    title: "Destroy Section",
                    message: "Are you sure you want to destroy this section and all its active components?",
                    confirmText: "Destroy",
                    cancelText: "Cancel"
                  });
                  if (confirmed) deleteSection(section.id);
                }}
                className="p-2 md:p-3 text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover/section:opacity-100 transition-all hover:bg-red-50 rounded-xl md:rounded-2xl shrink-0"
              >
                <PlusCircle className="rotate-45 md:hidden" size={18} />
                <PlusCircle className="rotate-45 hidden md:block" size={24} />
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, section.id)}
            >
              <SortableContext
                items={section.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4 md:space-y-6 min-h-[120px] md:min-h-[160px] p-3 md:p-10 rounded-[1.5rem] md:rounded-[3.5rem] bg-primary/10 border-2 border-dashed border-primary/50 hover:bg-primary/10 hover:border-primary/30 transition-all group/container relative overflow-x-hidden w-full max-w-full">
                  <AnimatePresence>
                      {section.fields.map((field) => (
                          <FieldCard key={field.id} field={field} />
                      ))}
                  </AnimatePresence>
                  
                  {/* Quick Add Menu within Section */}
                  <div className="pt-4 md:pt-6 border-t border-primary/30 flex flex-wrap items-center gap-2 md:gap-3 overflow-x-hidden">
                    <span className="text-[8px] md:text-[9px] font-black text-primary/50 uppercase tracking-[0.2em] w-full mb-1 md:mb-2">Add Component</span>
                    {["input", "textarea", "radio", "select", "checkbox", "file"].map((type) => (
                      <button
                        key={type}
                        onClick={() => useBuilderStore.getState().addField(type as any, section.id)}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-card border border-border rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all capitalize shrink-0"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>

                  {section.fields.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center opacity-20 group-hover/container:opacity-40 transition-opacity">
                        <Layout size={28} className="md:hidden mx-auto mb-2 text-primary/60" />
                        <Layout size={40} className="hidden md:block mx-auto mb-2 text-primary/60" />
                        <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                          Empty Section
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>
            );
          })}

        <button
          onClick={() => addSection()}
          className="w-full py-10 md:py-16 border-2 md:border-4 border-dashed border-border rounded-[2rem] md:rounded-[4rem] flex flex-col items-center justify-center text-center px-6 md:px-12 bg-card/40 hover:bg-card hover:border-primary/30 hover:text-primary transition-all group"
        >
          <div className="w-14 h-14 md:w-20 md:h-20 bg-muted text-muted-foreground/50 rounded-xl md:rounded-[2rem] flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all mb-4 md:mb-6 relative">
              <PlusCircle size={28} className="md:hidden" />
              <PlusCircle size={36} className="hidden md:block" />
              <div className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                <Sparkles size={12} className="md:hidden" />
                <Sparkles size={14} className="hidden md:block" />
              </div>
          </div>
          <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary mb-1 md:mb-2">
            Add New Section
          </h3>
          <p className="text-[9px] md:text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Organize schema into modules</p>
        </button>

        {sections.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 md:py-40 border-2 md:border-4 border-dashed border-border rounded-[2rem] md:rounded-[4rem] flex flex-col items-center justify-center text-center px-6 md:px-12 bg-card/50 backdrop-blur-sm"
          >
            <div className="relative mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-primary shadow-2xl shadow-primary/20 text-primary-foreground rounded-xl md:rounded-[2rem] flex items-center justify-center relative z-10 rotate-3">
                    <PlusCircle size={32} className="md:hidden" strokeWidth={1.5} />
                    <PlusCircle size={44} className="hidden md:block" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 md:w-12 md:h-12 bg-amber-400 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg z-20 -rotate-12">
                    <Sparkles size={16} className="md:hidden" />
                    <Sparkles size={24} className="hidden md:block" />
                </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-3 md:mb-4 font-display text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground uppercase">
                Initialize Canvas
            </h2>
            <p className="text-muted-foreground max-w-sm leading-relaxed font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em]">
                Create your first module to start design.
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {sections.length > 0 && (
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-foreground/90 backdrop-blur-xl text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-4 text-xs font-black tracking-[0.2em] uppercase z-40"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgb(34,197,94)]" />
                <span>Modular Engine Active</span>
                <span className="w-px h-4 bg-white/20 mx-1" />
                <span className="text-primary/60 text-[10px]">{sections.length} Modules / {sections.reduce((acc, s) => acc + s.fields.length, 0)} Entities</span>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default BuilderCanvas;

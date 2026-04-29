"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBuilderStore } from "../../store/useBuilderStore";
import InputField from "../common/InputField";
import { X, Settings2, Sliders, AlertCircle, Trash2, ShieldCheck, ListTree, Code } from "lucide-react";
import { usePopup } from "../../contexts/PopupContext";

const FieldSettingsPanel = () => {
  const selectedField = useBuilderStore((state) => state.selectedField);
  const setSelectedField = useBuilderStore((state) => state.setSelectedField);
  const updateField = useBuilderStore((state) => state.updateField);
  const deleteField = useBuilderStore((state) => state.deleteField);
  const { showPopup } = usePopup();

  if (!selectedField) {
    return (
      <aside className="w-[360px] bg-white border-l h-full shrink-0 flex flex-col items-center justify-center text-center p-10 gap-8 relative overflow-hidden">
        <div className="relative">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-[2.5rem] flex items-center justify-center border-4 border-dashed border-gray-100 relative z-10 rotate-6">
                <Sliders size={40} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-400 z-20">
                <Code size={14} />
            </div>
        </div>
        <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.25em] font-display">Configuration</h3>
            <p className="text-sm text-gray-400 font-bold leading-relaxed max-w-[200px] mx-auto">
              Select a component on the canvas to customize its <span className="text-indigo-300">API keys</span> and <span className="text-indigo-300">validation logic</span>.
            </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-gray-50 rounded-full blur-3xl opacity-50" />
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-white border-l h-full shrink-0 flex flex-col shadow-[-20px_0px_50px_rgba(0,0,0,0.02)] z-30 overflow-hidden relative">
      <div className="p-8 border-b bg-white/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-1 font-display">Field Properties</h2>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gray-900 font-display tracking-tight leading-none uppercase">
                {selectedField.type}
            </span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgb(34,197,94)]" />
          </div>
        </div>
        <button
          onClick={() => setSelectedField(null)}
          className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 text-gray-400 hover:rotate-90"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedField.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* Core Identity */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Settings2 size={18} />
                 </div>
                 <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.1em] font-display">
                    Base Configuration
                 </h3>
              </div>

              <div className="space-y-8">
                <InputField
                    label="Display Label"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    placeholder="e.g. Profile Picture"
                />
                <InputField
                    label="API Response Key"
                    value={selectedField.name}
                    onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                    placeholder="e.g. profile_url"
                    className="font-mono"
                />
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                 <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-amber-800 font-bold leading-relaxed italic uppercase tracking-tight">
                   The <span className="bg-amber-100 px-1 rounded">API Key</span> MUST be unique within this schema to avoid data collisions in JSON payloads.
                 </p>
              </div>
            </section>

            {/* Validation Logic */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={18} />
                 </div>
                 <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.1em] font-display">
                    Data Integrity
                 </h3>
              </div>
              
              <div 
                className="flex items-center justify-between p-5 bg-white border-2 border-gray-50 rounded-3xl group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer"
                onClick={() => updateField(selectedField.id, { validations: { ...selectedField.validations, required: !selectedField.validations?.required } })}
              >
                 <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight leading-none">Strictly Required</span>
                    <span className="text-[9px] font-bold text-gray-400 leading-none">Fails submission if missing</span>
                 </div>
                 <div className={`w-12 h-6 rounded-full transition-all duration-300 relative p-1 ${selectedField.validations?.required ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${selectedField.validations?.required ? 'translate-x-6' : 'translate-x-0'}`} />
                 </div>
              </div>

              {(selectedField.type === "input" || selectedField.type === "textarea") && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="Min Length"
                        type="number"
                        value={selectedField.validations?.minLength || ""}
                        onChange={(e) => 
                        updateField(selectedField.id, { 
                            validations: { ...selectedField.validations, minLength: parseInt(e.target.value) || undefined } 
                        })
                        }
                    />
                    <InputField
                        label="Max Length"
                        type="number"
                        value={selectedField.validations?.maxLength || ""}
                        onChange={(e) => 
                        updateField(selectedField.id, { 
                            validations: { ...selectedField.validations, maxLength: parseInt(e.target.value) || undefined } 
                        })
                        }
                    />
                  </div>
                   <InputField
                    label="Validation Pattern (Regex)"
                    className="font-mono"
                    value={selectedField.validations?.pattern || ""}
                    onChange={(e) => 
                      updateField(selectedField.id, { 
                        validations: { ...selectedField.validations, pattern: e.target.value || undefined } 
                      })
                    }
                    placeholder="e.g. ^[0-9]+$"
                  />
                </div>
              )}

              {selectedField.type === "file" && (
                 <div 
                    className="flex items-center justify-between p-5 bg-white border-2 border-gray-50 rounded-3xl group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer"
                    onClick={() => updateField(selectedField.id, { multiple: !selectedField.multiple })}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight leading-none">Parallel Uploads</span>
                        <span className="text-[9px] font-bold text-gray-400 leading-none">Accept multiple asset entities</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-all duration-300 relative p-1 ${selectedField.multiple ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${selectedField.multiple ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>
              )}
            </section>

            {/* Options Management */}
            {(selectedField.type === "radio" || selectedField.type === "checkbox") && (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <ListTree size={18} />
                    </div>
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.1em] font-display">
                        Value Mappings
                    </h3>
                </div>
                <div className="space-y-4">
                  {selectedField.options?.map((opt, idx) => (
                    <motion.div 
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 items-end group"
                    >
                       <InputField
                        label={`Option Entry ${idx + 1}`}
                        value={opt.label}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[idx] = { 
                            label: e.target.value, 
                            value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                          };
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        className="flex-1"
                      />
                      <button 
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== idx);
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        className="w-12 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all mb-0.5"
                      >
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(selectedField.options || []), { label: "New Option", value: "new_option" }];
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="w-full py-5 bg-white border-3 border-dashed border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    + Append Mapping
                  </button>
                </div>
              </section>
            )}

            <div className="pt-10">
              <button
                onClick={async () => {
                  const confirmed = await showPopup({
                    type: "confirm",
                    title: "Destroy Field",
                    message: "Permanently destroy this field schema?",
                    confirmText: "Destroy",
                    cancelText: "Cancel"
                  });
                  if (confirmed) {
                    deleteField(selectedField.id);
                  }
                }}
                className="w-full py-5 flex items-center justify-center gap-3 text-red-500 bg-red-50/50 hover:bg-red-50 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-100/50"
              >
                <Trash2 size={16} />
                Destroy Field Entity
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default FieldSettingsPanel;

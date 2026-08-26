"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Tablet, Smartphone, Eye } from "lucide-react";
import { useBuilderStore, type PreviewDevice } from "../../store/useBuilderStore";
import FieldRenderer from "../renderer/FieldRenderer";
import DeviceFrame from "./DeviceFrame";
import { validateField } from "../../utils/validation";

const DEVICE_OPTIONS: { key: PreviewDevice; icon: typeof Monitor; label: string }[] = [
  { key: "desktop", icon: Monitor, label: "Desktop" },
  { key: "tablet", icon: Tablet, label: "Tablet" },
  { key: "phone", icon: Smartphone, label: "Phone" },
];

export default function FormPreview() {
  const { sections, previewDevice, setPreviewDevice } = useBuilderStore();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const allFields = useMemo(
    () => sections.flatMap((s) => s.fields),
    [sections]
  );

  useEffect(() => {
    setFormData((prev) => {
      const next: Record<string, any> = {};
      for (const field of allFields) {
        if (field.type === "checkbox" || field.type === "file") {
          next[field.name] = prev[field.name] ?? [];
        } else {
          next[field.name] = prev[field.name] ?? "";
        }
      }
      return next;
    });
  }, [allFields]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const field of allFields) {
      const error = validateField(field, formData[field.name]);
      if (error) errors[field.name] = error;
    }
    return errors;
  }, [allFields, formData]);

  const hasContent = sections.length > 0 && allFields.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background h-full">
      {/* Device Switcher Bar */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-1">
          {DEVICE_OPTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setPreviewDevice(key)}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                previewDevice === key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {hasContent ? (
            <motion.div
              key={previewDevice}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-full mx-auto"
            >
              <DeviceFrame device={previewDevice}>
                <div className="px-4 md:px-8 lg:px-12 py-6 md:py-10 space-y-10 md:space-y-16">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-6 md:space-y-8">
                      {section.title && (
                        <div className="flex items-center gap-3 md:gap-4 px-1">
                          <h3 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] font-display whitespace-nowrap">
                            {section.title}
                          </h3>
                          <div className="h-px w-full bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                      )}
                      <div className="space-y-8 md:space-y-10">
                        {section.fields.map((field) => (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            value={formData[field.name]}
                            onChange={(val) => handleFieldChange(field.name, val)}
                            error={validationErrors[field.name]}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DeviceFrame>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-muted/50 flex items-center justify-center mb-4 md:mb-6">
                <Eye className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm md:text-base font-black text-muted-foreground uppercase tracking-widest mb-2">
                No Preview Available
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground/60 font-medium max-w-[280px]">
                Add sections and fields to the canvas to see a live preview of your form
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

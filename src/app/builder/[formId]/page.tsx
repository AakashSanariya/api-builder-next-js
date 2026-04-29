"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../../services/form.service";
import { useBuilderStore } from "../../../store/useBuilderStore";
import BuilderSidebar from "../../../components/builder/BuilderSidebar";
import BuilderCanvas from "../../../components/builder/BuilderCanvas";
import FieldSettingsPanel from "../../../components/builder/FieldSettingsPanel";
import { Loader2, ArrowLeft, Save, Rocket, Layout, Globe } from "lucide-react";
import Button from "../../../components/common/Button";
import { usePopup } from "../../../contexts/PopupContext";

export default function BuilderPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showPopup } = usePopup();
  
  const { 
    setSections, 
    setFormName, 
    setFormSlug,
    setIsPublished, 
    sections, 
    formName,
    formSlug, 
    isPublished,
    reset 
  } = useBuilderStore();


  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await formService.getFormById(formId as string);
        if (res.success && res.data) {
          // Backward compatibility: if no sections but fields exist, put fields in a default section
          if (res.data.sections && res.data.sections.length > 0) {
            setSections(res.data.sections);
          } else if (res.data.fields && res.data.fields.length > 0) {
            setSections([{ id: 'section_default', title: 'Default Section', fields: res.data.fields }]);
          }
          setFormName(res.data.name);
          setFormSlug(res.data.slug);
          setIsPublished(res.data.published);
        }
      } catch (err) {
        console.error(err);
        router.push("/forms");
      } finally {
        setLoading(false);
      }
    };

    if (formId) fetchForm();
    
    return () => reset();
  }, [formId]);

  const handleSave = async (publish: boolean = false) => {
    // Flatten all fields from all sections to check for validation
    const allFields = sections.flatMap(s => s.fields);
    
    // Check for duplicate API Keys (names)
    const names = allFields.map(f => f.name.trim().toLowerCase());
    const hasDuplicates = names.some((name, idx) => names.indexOf(name) !== idx && name !== "");
    const hasEmptyKeys = allFields.some(f => !f.name || f.name.trim() === "");
    
    if (hasDuplicates || hasEmptyKeys) {
      await showPopup({
        title: "Validation Error",
        message: hasEmptyKeys 
          ? "One or more fields are missing an API Response Key. All fields must have a valid identifier."
          : "Duplicate API Response Keys detected. Each field must have a unique key to prevent data collisions.",
        type: "alert"
      });
      return;
    }

    setSaving(true);
    try {
      // Send sections instead of fields
      const res = await formService.updateSchema(formId as string, sections, publish || isPublished);
      if (res.success && res.data) {
        setIsPublished(res.data.published);
        await showPopup({
          title: "Success",
          message: publish ? "🚀 Schema Published & Live!" : "💾 Changes stored successfully."
        });
      }
    } catch (err) {
      await showPopup({
        title: "Error",
        message: "System sync error. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
            <Loader2 className="text-indigo-600" size={48} />
        </motion.div>
      </div>
    );
  }

  const allFields = sections.flatMap(s => s.fields);
  const names = allFields.map(f => f.name.trim().toLowerCase());
  const hasDuplicates = names.some((name, idx) => names.indexOf(name) !== idx && name !== "");
  const hasEmptyKeys = allFields.some(f => !f.name || f.name.trim() === "");
  const isInvalid = hasDuplicates || hasEmptyKeys;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Premium Glass Header */}
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b px-8 flex items-center justify-between z-40 shrink-0 sticky top-0">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/forms")}
            className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          <div className="h-8 w-px bg-gray-100" />

          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 font-display tracking-tight leading-none">{formName}</h1>

                <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {isPublished ? 'Live' : 'Draft'}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
                <Globe size={10} className="text-gray-300" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Schema ID: {formId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => router.push(`/view/${formSlug}`)}
            className="text-gray-400 border-gray-100"
          >
            <Globe size={18} className="mr-2 opacity-50" />
            Live Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSave(false)}
            isLoading={saving}
            disabled={isInvalid}
            className={`border-gray-100 bg-white ${isInvalid ? 'opacity-50 grayscale' : ''}`}
            title={isInvalid ? (hasEmptyKeys ? "One or more API Keys are empty" : "Duplicate API Keys detected") : "Sync changes"}
          >
            <Save size={18} className="mr-2 opacity-50" />
            Sync Draft
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleSave(true)}
            isLoading={saving}
            disabled={isInvalid}
            className={isInvalid ? 'opacity-50 grayscale' : ''}
            title={isInvalid ? (hasEmptyKeys ? "One or more API Keys are empty" : "Duplicate API Keys detected") : isPublished ? "Update Production" : "Deploy API"}
          >
            <Rocket size={18} className="mr-2" />
            {isPublished ? 'Update Production' : 'Deploy API'}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <BuilderSidebar />
        <BuilderCanvas />
        <FieldSettingsPanel />
      </div>

      {/* Decorative backdrop glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none z-0" />
    </div>
  );
}

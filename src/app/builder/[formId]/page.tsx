"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../../services/form.service";
import { useBuilderStore } from "../../../store/useBuilderStore";
import BuilderSidebar from "../../../components/builder/BuilderSidebar";
import BuilderCanvas from "../../../components/builder/BuilderCanvas";
import FieldSettingsPanel from "../../../components/builder/FieldSettingsPanel";
import { Loader2, ArrowLeft, Save, Rocket, Layout, Globe, PanelLeftClose, PanelLeftOpen, Settings2 } from "lucide-react";
import Button from "../../../components/common/Button";
import { usePopup } from "../../../contexts/PopupContext";

export default function BuilderPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showPopup } = usePopup();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { 
    setSections, 
    setFormName, 
    setFormSlug,
    setIsPublished, 
    sections, 
    formName,
    formSlug, 
    isPublished,
    reset,
    selectedField
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
            <Loader2 className="text-indigo-600 w-9 h-9 md:w-12 md:h-12" />
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
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b px-4 md:px-8 flex items-center justify-between z-40 shrink-0 sticky top-0 gap-2 md:gap-0">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/forms")}
            className="p-2 md:p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl md:rounded-2xl transition-all shrink-0"
          >
            <ArrowLeft size={16} className="" />
          </motion.button>
           
          <div className="h-6 md:h-8 w-px bg-gray-100 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
                <h1 className="text-base md:text-xl font-black text-gray-900 font-display tracking-tight leading-none truncate">{formName}</h1>

                <div className={`px-1.5 py-0.5 md:px-2 rounded text-[7px] md:text-[8px] font-black uppercase tracking-widest border shrink-0 ${isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {isPublished ? 'Live' : 'Draft'}
                </div>
            </div>
            <div className="hidden md:flex items-center gap-2 mt-1.5">
                <Globe size={10} className="text-gray-300" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">Schema ID: {formId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Mobile Menu Buttons */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 md:hidden bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-all"
            title="Toggle Components"
          >
            <Layout size={16} />
          </button>
          
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 md:hidden rounded-xl transition-all ${selectedField ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
            title="Toggle Settings"
          >
            <Settings2 size={16} />
          </button>

          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => router.push(`/view/${formSlug}`)}
            className="hidden md:flex text-gray-400 border-gray-100"
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
            className={`hidden md:flex border-gray-100 bg-white ${isInvalid ? 'opacity-50 grayscale' : ''}`}
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
            className={`${isInvalid ? 'opacity-50 grayscale' : ''} text-xs md:text-sm px-3 md:px-4`}
            title={isInvalid ? (hasEmptyKeys ? "One or more API Keys are empty" : "Duplicate API Keys detected") : isPublished ? "Update Production" : "Deploy API"}
          >
            <Rocket size={14} className="md:mr-2 " />
            <span className="hidden sm:inline">{isPublished ? 'Update' : 'Deploy'}</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-black/50 z-50 md:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute left-0 top-0 bottom-0 z-50 w-[320px] md:hidden"
              >
                <BuilderSidebar />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <BuilderSidebar />
        </div>

        <BuilderCanvas />
        
        {/* Mobile Settings Overlay */}
        <AnimatePresence>
          {settingsOpen && selectedField && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSettingsOpen(false)}
                className="absolute inset-0 bg-black/50 z-50 md:hidden"
              />
              <motion.aside
                initial={{ x: 360 }}
                animate={{ x: 0 }}
                exit={{ x: 360 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 z-50 w-[360px] md:hidden"
              >
                <FieldSettingsPanel />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Settings Panel */}
        <div className="hidden md:block">
          <FieldSettingsPanel />
        </div>
      </div>

      {/* Decorative backdrop glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none z-0" />
    </div>
  );
}

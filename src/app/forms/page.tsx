"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../services/form.service";
import { FormModel } from "../../types/form.types";
import { usePopup } from "../../contexts/PopupContext";
import { Plus, Edit2, ExternalLink, Activity, Layout, Search, Layers, Box, Terminal, Globe, Loader2 } from "lucide-react";

import Button from "../../components/common/Button";

export default function Dashboard() {
  const [forms, setForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();
  const { showPopup } = usePopup();

  const fetchForms = async () => {
    try {
      const res = await formService.getAllForms();
      if (res.success && res.data) setForms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    const name = await showPopup({
      type: "prompt",
      title: "New API Schema",
      message: "Enter a memorable name for your API Schema:",
      confirmText: "Create",
      cancelText: "Cancel"
    });

    if (!name) return;

    setIsCreating(true);
    try {
      const res = await formService.createForm(name);
      if (res.success && res.data) {
        router.push(`/builder/${res.data._id}`);
      }
    } catch (err) {
      console.log(err);
      await showPopup({
        type: "alert",
        title: "Registration Failed",
        message: "This name might already be reserved."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSchema = async (form: FormModel) => {
    const confirmed = await showPopup({
      type: "confirm",
      title: "Destroy Schema Entity",
      message: `Are you sure you want to permanently destroy '${form.name}'? All submissions and endpoint logic will be erased.`,
      confirmText: "Erase Entity",
      cancelText: "Cancel",
      validationValue: form.name
    });

    if (!confirmed) return;

    setIsDeleting(form?._id ?? "");
    try {
      const res = await formService.deleteForm(form?._id ?? "");
      if (res.success) {
        fetchForms();
      }
    } catch (err) {
      console.error(err);
      await showPopup({
        type: "alert",
        title: "Delete Failed",
        message: "An internal database error prevented this operation."
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 lg:mb-16 relative gap-4 sm:gap-0">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Box size={18} className="md:hidden" />
                <Box size={24} className="hidden md:block" />
              </div>
              <span className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-[0.3em] font-display">System Core</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-[900] text-gray-900 tracking-tight font-display leading-[0.9]">
              API <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Schemas</span>
            </h1>
            <p className="text-gray-400 mt-3 md:mt-6 text-sm md:text-base lg:text-lg font-bold max-w-md leading-relaxed">
              Design fluid data structures and generate hyper-scalable JSON endpoints in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full sm:w-auto"
          >
            <Button
              onClick={handleCreateForm}
              isLoading={isCreating}
              size="lg"
              className="rounded-[2rem] w-full sm:w-auto"
            >
              <Plus className="mr-2 md:mr-3" size={20} />
              <span className="md:inline">Create Schema Entity</span>
              <span className="inline md:hidden">Create Schema</span>
            </Button>
          </motion.div>

          {/* Decorative Background Element */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 md:h-64 bg-white animate-pulse rounded-[2rem] md:rounded-[2.5rem] border border-gray-50 shadow-sm" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
          >
            <AnimatePresence>
              {forms.map((form, idx) => (
                  <motion.div
                    key={form._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_10px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.12)] transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6 md:mb-10 relative z-10">
                      <div className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm
                                  ${form.published
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"}`}
                      >
                        {form.published ? "Active" : "Draft"}
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:rotate-12">
                        <Terminal size={16} className="md:hidden" />
                        <Terminal size={20} className="hidden md:block" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-2 truncate font-display group-hover:text-indigo-600 transition-colors">
                        {form.name}
                      </h2>
                      <div className="flex items-center gap-2 mb-6 md:mb-10">
                        <Search size={10} className="md:hidden text-gray-300" />
                        <Search size={12} className="hidden md:block text-gray-300" />
                        <span className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-widest italic truncate block">
                          {form.slug}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10 mb-3 md:mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/builder/${form._id}`)}
                        className="w-full h-11 md:h-14 text-xs md:text-sm rounded-xl md:rounded-2xl bg-gray-50/50 hover:bg-white"
                      >
                        <Edit2 size={14} className="md:mr-2" />
                        <span className="hidden md:inline">Design</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/api-docs/${form._id}`)}
                        className="w-full h-11 md:h-14 text-xs md:text-sm rounded-xl md:rounded-2xl"
                      >
                        <ExternalLink size={14} className="md:mr-2" />
                        <span className="hidden md:inline">Docs</span>
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/submissions/${form.slug}`)}
                      className="w-full h-10 md:h-12 rounded-lg md:rounded-xl text-gray-500 border-gray-50 hover:border-indigo-300 hover:text-indigo-600 bg-gray-50/10 mb-3 md:mb-4 text-xs md:text-sm"
                    >
                      <Activity size={12} className="md:mr-2" />
                      <span className="hidden sm:inline">View Submitted Data</span>
                      <span className="sm:hidden">Submissions</span>
                    </Button>

                    <div className="grid grid-cols-[1fr_40px] md:grid-cols-[1fr_50px] gap-2 md:gap-3 relative z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 md:h-12 rounded-lg md:rounded-xl text-gray-500 border-gray-50 hover:border-indigo-300 hover:text-indigo-600 bg-gray-50/10 text-xs md:text-sm"
                        onClick={() => router.push(`/view/${form.slug}`)}
                      >
                        <Globe size={12} className="md:mr-2" />
                        <span className="hidden sm:inline">Public Portal</span>
                        <span className="sm:hidden">Portal</span>
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchema(form);
                        }}
                        disabled={isDeleting === form._id}
                        className="h-10 md:h-12 w-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg md:rounded-xl transition-all border border-red-100 shadow-sm disabled:opacity-50"
                        title="Destroy Schema"
                      >
                        {isDeleting === form._id ? <Loader2 className="animate-spin" size={16} /> : <Plus className="rotate-45" size={16} />}
                      </button>
                    </div>

                    {/* Decorative Background Icon */}
                    <Layers className="absolute -right-8 -bottom-8 w-32 md:w-40 h-32 md:h-40 text-gray-50/50 group-hover:text-indigo-50/50 transition-colors duration-500 -rotate-12 pointer-events-none" />
                  </motion.div>
              ))}
            </AnimatePresence>

            {forms.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 md:py-32 bg-white rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6 md:px-12"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-50 text-indigo-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6 md:mb-8 shadow-xl shadow-indigo-50/50">
                  <Plus size={32} className="md:hidden" />
                  <Plus size={48} className="hidden md:block" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 font-display tracking-tight mb-3 md:mb-4">No Schema Entities</h3>
                <p className="text-gray-400 max-w-sm mb-8 md:mb-10 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] leading-relaxed">
                  Initialize your core data engine by creating your first dynamic form entity.
                </p>
                <Button variant="primary" size="lg" onClick={handleCreateForm} className="rounded-[2rem] w-full sm:w-auto">
                  Initialize Core
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

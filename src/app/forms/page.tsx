"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../services/form.service";
import { FormModel } from "../../types/form.types";
import { Plus, Edit2, ExternalLink, Activity, Layout, Search, Layers, Box, Terminal, Globe } from "lucide-react";

import Button from "../../components/common/Button";

export default function Dashboard() {
  const [forms, setForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

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
    const name = prompt("Enter a memorable name for your API Schema:");
    if (!name) return;

    setIsCreating(true);
    try {
      const res = await formService.createForm(name);
      if (res.success && res.data) {
        router.push(`/builder/${res.data._id}`);
      }
    } catch (err) {
      console.log(err);
      alert("Registration failed. This name might already be reserved.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-16 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Box size={24} />
              </div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] font-display">System Core</span>
            </div>
            <h1 className="text-6xl font-[900] text-gray-900 tracking-tight font-display leading-[0.9]">
              API <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Schemas</span>
            </h1>
            <p className="text-gray-400 mt-6 text-lg font-bold max-w-md leading-relaxed">
              Design fluid data structures and generate hyper-scalable JSON endpoints in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={handleCreateForm}
              isLoading={isCreating}
              size="lg"
              className="rounded-[2rem]"
            >
              <Plus className="mr-3" size={24} />
              Create Schema Entity
            </Button>
          </motion.div>

          {/* Decorative Background Element */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white animate-pulse rounded-[2.5rem] border border-gray-50 shadow-sm" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            <AnimatePresence>
              {forms.map((form, idx) => (
                <motion.div
                  key={form._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-[0_10px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.12)] transition-all duration-500 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm
                                ${form.published
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"}`}
                    >
                      {form.published ? "Active Endpoint" : "Draft Entity"}
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:rotate-12">
                      <Terminal size={20} />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-2xl font-black text-gray-800 mb-2 truncate font-display group-hover:text-indigo-600 transition-colors">
                      {form.name}
                    </h2>
                    <div className="flex items-center gap-2 mb-10">
                      <Search size={12} className="text-gray-300" />
                      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest italic truncate block">
                        Slug: {form.slug}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/builder/${form._id}`)}
                      className="w-full h-14 rounded-2xl bg-gray-50/50 hover:bg-white"
                    >
                      <Edit2 size={16} className="mr-2" />
                      Design
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/api-docs/${form._id}`)}
                      className="w-full h-14 rounded-2xl"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Docs
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/submissions/${form.slug}`)}
                    className="w-full h-12 rounded-xl text-gray-500 border-gray-50 hover:border-indigo-300 hover:text-indigo-600 bg-gray-50/10 mb-4"
                  >
                    <Activity size={14} className="mr-2" />
                    View Submitted Data
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-12 rounded-xl text-gray-500 border-gray-50 hover:border-indigo-300 hover:text-indigo-600 bg-gray-50/10"
                    onClick={() => router.push(`/view/${form.slug}`)}
                  >
                    <Globe size={14} className="mr-2" />
                    Open Public Portal
                  </Button>

                  {/* Decorative Background Icon */}
                  <Layers className="absolute -right-8 -bottom-8 w-40 h-40 text-gray-50/50 group-hover:text-indigo-50/50 transition-colors duration-500 -rotate-12 pointer-events-none" />
                </motion.div>
              ))}
            </AnimatePresence>

            {forms.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 bg-white rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-12"
              >
                <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-50/50">
                  <Plus size={48} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 font-display tracking-tight mb-4">No Schema Entities</h3>
                <p className="text-gray-400 max-w-sm mb-10 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                  Initialize your core data engine by creating your first dynamic form entity.
                </p>
                <Button variant="primary" size="lg" onClick={handleCreateForm} className="rounded-[2rem]">
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

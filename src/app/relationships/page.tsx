"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { relationshipService } from "../../services/relationship.service";
import { formService } from "../../services/form.service";
import { Relationship, RelationshipType } from "../../types/relationship.types";
import { FormModel } from "../../types/form.types";
import { usePopup } from "../../contexts/PopupContext";
import CreateRelationshipModal from "../../components/relationships/CreateRelationshipModal";
import {
  GitBranch,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Share2,
  ToggleLeft,
  ToggleRight,
  Box,
  ArrowRight,
} from "lucide-react";
import Button from "../../components/common/Button";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

const TYPE_BADGES: Record<RelationshipType, { label: string; color: string }> = {
  "one-to-one": { label: "1:1", color: "text-blue-600 bg-blue-50 border-blue-100" },
  "one-to-many": { label: "1:N", color: "text-amber-600 bg-amber-50 border-amber-100" },
  "many-to-many": { label: "N:M", color: "text-purple-600 bg-purple-50 border-purple-100" },
};

function RelationshipsPageContent() {
  const router = useRouter();
  const { showPopup } = usePopup();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [forms, setForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      const [relRes, formsRes] = await Promise.all([
        relationshipService.getAll(),
        formService.getAllForms(),
      ]);
      if (relRes.success && relRes.data) setRelationships(relRes.data);
      if (formsRes.success && formsRes.data) setForms(formsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleEagerLoad = async (rel: Relationship) => {
    try {
      await relationshipService.update(rel._id, { eagerLoad: !rel.eagerLoad });
      setRelationships(prev =>
        prev.map(r => r._id === rel._id ? { ...r, eagerLoad: !r.eagerLoad } : r)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (rel: Relationship) => {
    const confirmed = await showPopup({
      type: "confirm",
      title: "Delete Relationship",
      message: `Remove relationship between '${rel.sourceLabel}' and '${rel.targetLabel}'? All data links will be preserved but the relationship definition will be removed.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await relationshipService.delete(rel._id);
      if (res.success) {
        setRelationships(prev => prev.filter(r => r._id !== rel._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-4">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <GitBranch size={24} />
              </div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] font-display">Data Mesh</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-[900] text-gray-900 tracking-tight font-display leading-[0.9]">
              Table <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Relationships</span>
            </h1>
            <p className="text-gray-400 mt-3 text-sm font-bold max-w-md">
              Define how your data tables connect to each other.
            </p>
          </motion.div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/forms")}
              className="text-xs"
            >
              <ArrowLeft size={14} className="mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="md"
              className="rounded-[2rem]"
            >
              <Plus size={18} className="mr-2" />
              New Relationship
            </Button>
          </div>
        </header>

        {relationships.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-indigo-50/50">
              <Share2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 font-display mb-3">No Relationships Defined</h3>
            <p className="text-gray-400 max-w-sm mb-8 font-bold text-[10px] uppercase tracking-[0.2em]">
              Create relationships between your data tables to enable cross-table data loading and nested submissions.
            </p>
            <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)} className="rounded-[2rem]">
              Define First Relationship
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {relationships.map((rel, idx) => {
              const badge = TYPE_BADGES[rel.type];
              return (
                <motion.div
                  key={rel._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                    <div className="flex-1 flex items-center gap-4 md:gap-6 w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                          <Box size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{rel.sourceLabel}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{rel.sourceForm?.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-black text-[10px] px-3 py-1 rounded-lg border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <ArrowRight size={16} className="text-gray-300" />
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                          <Box size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{rel.targetLabel}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{rel.targetForm?.slug}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleToggleEagerLoad(rel)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          rel.eagerLoad
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-gray-50 text-gray-400 border border-gray-100"
                        }`}
                        title="Toggle eager loading"
                      >
                        {rel.eagerLoad ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        Auto-load
                      </button>

                      <button
                        onClick={() => router.push(`/relationships/${rel.sourceFormId}`)}
                        className="p-2 bg-gray-50 hover:bg-indigo-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-all border border-gray-100"
                        title="View diagram"
                      >
                        <GitBranch size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(rel)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-400 hover:text-red-600 transition-all border border-red-100"
                        title="Delete relationship"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <CreateRelationshipModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          forms={forms}
          onCreated={() => { fetchData(); }}
        />
      </div>
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <ProtectedRoute>
      <RelationshipsPageContent />
    </ProtectedRoute>
  );
}

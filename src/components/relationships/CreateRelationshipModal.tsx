"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Loader2, ArrowRight } from "lucide-react";
import { FormModel } from "../../types/form.types";
import { Relationship, RelationshipType } from "../../types/relationship.types";
import { relationshipService } from "../../services/relationship.service";
import Select from "../common/Select";
import Button from "../common/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  forms: FormModel[];
  preselectedSourceId?: string;
  onCreated: (rel: Relationship) => void;
}

const RELATIONSHIP_TYPES: { label: string; value: string }[] = [
  { label: "One to One (1:1)", value: "one-to-one" },
  { label: "One to Many (1:N)", value: "one-to-many" },
  { label: "Many to Many (N:M)", value: "many-to-many" },
];

export default function CreateRelationshipModal({
  isOpen,
  onClose,
  forms,
  preselectedSourceId,
  onCreated,
}: Props) {
  const [sourceFormId, setSourceFormId] = useState<string>("");
  const [targetFormId, setTargetFormId] = useState<string>("");
  const [type, setType] = useState<string>("one-to-many");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [targetLabel, setTargetLabel] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (preselectedSourceId) {
      setSourceFormId(preselectedSourceId);
      const sourceForm = forms.find(f => f._id === preselectedSourceId);
      if (sourceForm) setSourceLabel(sourceForm.name);
    }
  }, [preselectedSourceId, forms]);

  useEffect(() => {
    if (sourceFormId && !preselectedSourceId) {
      const form = forms.find(f => f._id === sourceFormId);
      if (form) setSourceLabel(form.name);
    }
  }, [sourceFormId, forms, preselectedSourceId]);

  useEffect(() => {
    if (targetFormId) {
      const form = forms.find(f => f._id === targetFormId);
      if (form) setTargetLabel(form.name);
    }
  }, [targetFormId, forms]);

  const formOptions = forms.map(f => ({
    label: f.name,
    value: f._id || "",
  }));

  const sourceOptions = formOptions;
  const targetOptions = formOptions.filter(o => o.value !== sourceFormId);

  const handleCreate = async () => {
    if (!sourceFormId || !targetFormId) {
      setError("Please select both source and target tables");
      return;
    }
    if (sourceFormId === targetFormId) {
      setError("Source and target cannot be the same table");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await relationshipService.create({
        sourceFormId,
        targetFormId,
        type: type as RelationshipType,
        sourceLabel: sourceLabel || undefined,
        targetLabel: targetLabel || undefined,
      });

      if (res.success && res.data) {
        onCreated(res.data);
        resetForm();
        onClose();
      } else {
        setError(res.message || "Failed to create relationship");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    if (!preselectedSourceId) setSourceFormId("");
    setTargetFormId("");
    setType("one-to-many");
    if (!preselectedSourceId) setSourceLabel("");
    setTargetLabel("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-overlay/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center p-0 md:p-4 z-50"
          >
            <div className="flex flex-col w-full h-full md:h-auto md:max-h-[85vh] md:max-w-[520px] bg-card md:rounded-[2.5rem] shadow-2xl border-0 md:border border-border">
              <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground font-display">New Relationship</h2>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Link two data tables</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:px-8 space-y-5 custom-scrollbar">
                <Select
                  label="Source Table"
                  options={sourceOptions}
                  value={sourceFormId}
                  onChange={(val) => {
                    setSourceFormId(String(val));
                    setError("");
                  }}
                />

                <div className="flex justify-center -my-1">
                  <ArrowRight size={20} className="text-primary/40" />
                </div>

                <Select
                  label="Target Table"
                  options={targetOptions}
                  value={targetFormId}
                  onChange={(val) => {
                    setTargetFormId(String(val));
                    setError("");
                  }}
                />

                <Select
                  label="Relationship Type"
                  options={RELATIONSHIP_TYPES}
                  value={type}
                  onChange={(val) => setType(String(val))}
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[10px] font-bold text-red-500 px-1 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                    {error}
                  </motion.p>
                )}
              </div>

              <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 flex gap-3 shrink-0 border-t border-border md:border-t-0">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-[2rem]"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 rounded-[2rem]"
                  onClick={handleCreate}
                  isLoading={submitting}
                >
                  {submitting ? "Creating..." : "Create Relationship"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

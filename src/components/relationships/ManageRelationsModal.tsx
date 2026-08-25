"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Link2, Unlink, Loader2, ChevronRight, Plus } from "lucide-react";
import { Relationship, LinkedRecord } from "../../types/relationship.types";
import { relationshipService } from "../../services/relationship.service";
import RecordPicker from "./RecordPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  slug: string;
  relationships: Relationship[];
  onUpdated: () => void;
}

export default function ManageRelationsModal({ isOpen, onClose, recordId, slug, relationships, onUpdated }: Props) {
  const [linkedByRel, setLinkedByRel] = useState<Record<string, LinkedRecord[]>>({});
  const [relData, setRelData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [pickingRelId, setPickingRelId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadLinks = async () => {
    setLoading(true);
    const result: Record<string, LinkedRecord[]> = {};
    const relInfo: Record<string, any> = {};
    for (const rel of relationships) {
      try {
        const res = await relationshipService.getRecordLinks(rel._id, recordId);
        if (res.success && res.data) {
          result[rel._id] = res.data;
        }
        relInfo[rel._id] = res.relationship || rel;
      } catch {
        result[rel._id] = [];
        relInfo[rel._id] = rel;
      }
    }
    setLinkedByRel(result);
    setRelData(relInfo);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && relationships.length > 0) {
      loadLinks();
    }
  }, [isOpen, recordId, relationships]);

  const getLabel = (rel: Relationship) => {
    return rel.sourceLabel || rel.targetLabel || "Related";
  };

  const flattenRecord = (data: Record<string, any>) => {
    if (!data) return {};
    const vals = Object.values(data);
    if (vals.some((v: any) => v !== null && typeof v === "object" && !Array.isArray(v))) {
      const flat: Record<string, any> = {};
      vals.forEach((v: any) => {
        if (typeof v === "object" && v !== null) Object.assign(flat, v);
      });
      return flat;
    }
    return data;
  };

  const handleUnlink = async (rel: Relationship, linked: LinkedRecord) => {
    setError("");
    const side = getFormSide(rel);
    try {
      const res = await relationshipService.unlinkRecords({
        relationshipId: rel._id,
        sourceRecordId: side === "source" ? recordId : linked.recordId,
        targetRecordId: side === "source" ? linked.recordId : recordId,
      });
      if (res.success) {
        await loadLinks();
        onUpdated();
      } else {
        setError(res.message || "Failed to unlink");
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlink");
    }
  };

  const getPopulated = (rel: Relationship, field: "sourceFormId" | "targetFormId"): any =>
    typeof rel[field] === "object" ? rel[field] : null;

  const getFormSide = (rel: Relationship): "source" | "target" => {
    const source = getPopulated(rel, "sourceFormId");
    const target = getPopulated(rel, "targetFormId");
    if (source?.slug === slug) return "source";
    if (target?.slug === slug) return "target";
    return "source";
  };

  const getFormId = (rel: Relationship, field: "sourceFormId" | "targetFormId"): string => {
    const obj = getPopulated(rel, field);
    return obj?._id || String(rel[field] || "");
  };

  const handleLink = async (rel: Relationship, linkedRecordId: string) => {
    setError("");
    const isCurrentSource = getFormSide(rel) === "source";
    try {
      const res = await relationshipService.linkRecords({
        sourceFormId: getFormId(rel, "sourceFormId"),
        sourceRecordId: isCurrentSource ? recordId : linkedRecordId,
        targetFormId: getFormId(rel, "targetFormId"),
        targetRecordId: isCurrentSource ? linkedRecordId : recordId,
        relationshipId: rel._id,
      });
      if (res.success) {
        setPickingRelId(null);
        await loadLinks();
        onUpdated();
      } else {
        setError(res.message || "Failed to link");
      }
    } catch (err: any) {
      setError(err.message || "Failed to link");
    }
  };

  const getTargetSlug = (rel: Relationship): string | undefined => {
    const source = getPopulated(rel, "sourceFormId");
    const target = getPopulated(rel, "targetFormId");
    if (source?.slug === slug) return target?.slug;
    if (target?.slug === slug) return source?.slug;
    return target?.slug || source?.slug;
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-start justify-center p-0 md:p-4 z-50 pt-16 md:pt-20"
          >
            <div className="flex flex-col w-full h-full md:h-auto md:max-h-[80vh] md:max-w-lg bg-card md:rounded-[2.5rem] shadow-2xl border-0 md:border border-border">
              <div className="flex items-center justify-between px-5 md:px-8 pt-5 md:pt-8 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <GitBranch size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground font-display">Manage Relations</h2>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Record: {recordId.slice(-8)}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:px-8 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary/40" />
                  </div>
                ) : relationships.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">No relationships defined</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {relationships.map((rel) => {
                      const linked = linkedByRel[rel._id] || [];
                      const label = getLabel(rel);
                      const count = linked.length;
                      const maxReached = rel.type === "one-to-one" && count >= 1;

                      return (
                        <div key={rel._id} className="bg-muted/50 rounded-2xl p-4 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-xs font-black text-foreground">{label}</h3>
                              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                                {rel.type} &middot; {count} linked
                              </span>
                            </div>
                            {!maxReached && (
                              <button
                                type="button"
                                onClick={() => setPickingRelId(pickingRelId === rel._id ? null : rel._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all"
                              >
                                <Plus size={12} />
                                Link
                              </button>
                            )}
                          </div>

                          {pickingRelId === rel._id && (
                            <div className="mb-3 border border-primary/20 rounded-xl overflow-hidden bg-card">
                              <RecordPicker
                                formSlug={getTargetSlug(rel) || ""}
                                excludeIds={linked.map((l) => l.recordId)}
                                onSelect={(targetId) => {
                                  handleLink(rel, targetId);
                                }}
                                onClose={() => setPickingRelId(null)}
                              />
                            </div>
                          )}

                          {count === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">No linked records</p>
                          ) : (
                            <div className="space-y-2">
                              {linked.map((l) => {
                                const flat = flattenRecord(l.data);
                                const preview = Object.entries(flat).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 25)}`).join(" | ");
                                return (
                                  <div key={l.linkId} className="flex items-center justify-between gap-2 bg-card rounded-xl p-3 border border-border">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-bold text-foreground truncate">{preview || l.recordId}</p>
                                      <p className="text-[8px] font-mono text-muted-foreground truncate">{l.recordId}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUnlink(rel, l)}
                                      className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all shrink-0"
                                      title="Unlink"
                                    >
                                      <Unlink size={12} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {error && (
                  <p className="mt-4 text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              <div className="px-5 md:px-8 pb-5 md:pb-8 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-wider rounded-2xl hover:bg-foreground/80 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

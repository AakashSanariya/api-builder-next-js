"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, Loader2 } from "lucide-react";
import { formService } from "../../services/form.service";
import FileDisplay from "../common/FileDisplay";

interface RecordItem {
  _id: string;
  data: Record<string, any>;
  createdAt?: string;
}

interface Props {
  formSlug: string;
  excludeIds: string[];
  onSelect: (recordId: string, recordData: Record<string, any>) => void;
  onClose: () => void;
}

export default function RecordPicker({ formSlug, excludeIds, onSelect, onClose }: Props) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await formService.listDynamicSubmissions(formSlug, { page: 1, limit: 200 });
        if (res.success && res.data) {
          setRecords(res.data.filter((r: any) => !excludeIds.includes(r._id)));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formSlug, excludeIds]);

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

  const filtered = records.filter((r) => {
    if (!search) return true;
    const flat = flattenRecord(r.data);
    const text = Object.values(flat).join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) || r._id.includes(search);
  });

  const handleConfirm = () => {
    if (!selectedId) return;
    const record = records.find((r) => r._id === selectedId);
    if (record) {
      onSelect(selectedId, flattenRecord(record.data));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          autoFocus
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
              {search ? "No matching records" : "No records available"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((r) => {
              const flat = flattenRecord(r.data);
              const entries = Object.entries(flat).slice(0, 2);
              return (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => setSelectedId(r._id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-all ${
                    selectedId === r._id
                      ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">
                      {entries.length === 0 ? (
                        r._id
                      ) : (
                        <span className="inline-flex items-center gap-2 flex-wrap">
                          {entries.map(([k, v]) => (
                            <span key={k} className="inline-flex items-center gap-1">
                              <span className="font-mono text-[9px] text-muted-foreground">{k}:</span>
                              <FileDisplay value={v} compact />
                            </span>
                          ))}
                        </span>
                      )}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">{r._id}</p>
                  </div>
                  {selectedId === r._id && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider rounded-xl hover:bg-muted transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
            selectedId
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed"
          }`}
        >
          Link Record
        </button>
      </div>
    </div>
  );
}

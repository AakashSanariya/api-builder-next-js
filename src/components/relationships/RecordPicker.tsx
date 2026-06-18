"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, Loader2 } from "lucide-react";
import { formService } from "../../services/form.service";

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
        const res = await formService.listDynamicSubmissions(formSlug, 1, 200);
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
      <div className="p-3 border-b border-gray-50 flex items-center gap-2">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          autoFocus
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 placeholder:text-gray-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              {search ? "No matching records" : "No records available"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((r) => {
              const flat = flattenRecord(r.data);
              const preview = Object.entries(flat).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(" | ");
              return (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => setSelectedId(r._id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-all ${
                    selectedId === r._id
                      ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{preview || r._id}</p>
                    <p className="text-[9px] font-mono text-gray-400 truncate mt-0.5">{r._id}</p>
                  </div>
                  {selectedId === r._id && <Check size={14} className="text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-50 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
            selectedId
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          Link Record
        </button>
      </div>
    </div>
  );
}

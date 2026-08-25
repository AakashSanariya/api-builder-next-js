"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formService } from "../../../services/form.service";
import Button from "../../../components/common/Button";
import { usePopup } from "../../../contexts/PopupContext";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Link2,
  Search,
  SlidersHorizontal,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronLeft,
  Download,
} from "lucide-react";
import { Relationship } from "../../../types/relationship.types";
import { FormModel, Pagination, SubmissionRecord } from "../../../types/form.types";
import { FieldSchema } from "../../../types/field.types";
import { relationshipService } from "../../../services/relationship.service";
import ManageRelationsModal from "../../../components/relationships/ManageRelationsModal";
import FileDisplay from "../../../components/common/FileDisplay";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

type ColumnDef = {
  key: string;
  label: string;
  type?: FieldSchema["type"];
  options?: FieldSchema["options"];
  sectionKey?: string;
};

const slugifyLabel = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");

const NON_VALUE_TYPES = new Set(["button", "link"]);
const EXACT_FILTER_TYPES = new Set(["select", "radio", "checkbox"]);

function SubmissionListPageContent() {
  const { slug } = useParams();
  const router = useRouter();
  const [formDef, setFormDef] = useState<FormModel | null>(null);
  const [rows, setRows] = useState<SubmissionRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relModalRecordId, setRelModalRecordId] = useState<string | null>(null);

  // Query state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection (bulk actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Export
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showPopup } = usePopup();

  /* ---------------- Schema-derived columns ---------------- */

  const columns: ColumnDef[] = useMemo(() => {
    if (!formDef) return [];
    const sections = Array.isArray(formDef.sections) ? formDef.sections : [];

    if (sections.length > 0) {
      return sections.flatMap((section) =>
        (section.fields || [])
          .filter((field) => !NON_VALUE_TYPES.has(field.type))
          .map((field) => ({
            key: field.name,
            label: field.label || field.name,
            type: field.type,
            options: field.options,
            sectionKey: `section_${section.title ? slugifyLabel(section.title) : section.id}`,
          }))
      );
    }

    return (Array.isArray(formDef.fields) ? formDef.fields : [])
      .filter((field) => !NON_VALUE_TYPES.has(field.type))
      .map((field) => ({
        key: field.name,
        label: field.label || field.name,
        type: field.type,
        options: field.options,
      }));
  }, [formDef]);

  const getFieldValue = (record: SubmissionRecord, col: ColumnDef) => {
    if (!record?.data) return undefined;
    if (col.sectionKey) {
      const sectionData = record.data[col.sectionKey];
      if (sectionData && typeof sectionData === "object" && col.key in sectionData) {
        return sectionData[col.key];
      }
    }
    return record.data[col.key];
  };

  // Heuristic: treat a text-filterable column as numeric when every sampled value parses as a number
  const numericColumnKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!rows.length || !columns.length) return keys;
    columns.forEach((col) => {
      if (EXACT_FILTER_TYPES.has(col.type || "") || col.type === "file") return;
      let sawValue = false;
      const allNumeric = rows.every((row) => {
        const v = getFieldValue(row, col);
        if (v === undefined || v === null || v === "") return true;
        sawValue = true;
        return typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));
      });
      if (sawValue && allNumeric) keys.add(col.key);
    });
    return keys;
  }, [rows, columns]);

  /* ---------------- Data loading ---------------- */

  const loadData = useCallback(async () => {
    try {
      const res = await formService.listDynamicSubmissions(slug as string, {
        page,
        limit: pageSize,
        search,
        sortField,
        sortOrder,
        filters: filterValues,
      });
      if (res.success && res.data) {
        setRows(res.data);
        setPagination(res.pagination ?? null);
      } else {
        setError(res.message || "Could not load submissions.");
      }
    } catch (err: any) {
      setError(err.message || "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }, [slug, page, pageSize, search, sortField, sortOrder, filterValues]);

  useEffect(() => {
    if (slug) loadData();
  }, [slug, loadData]);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (slug) {
      formService
        .getFormBySlug(slug as string)
        .then((res) => {
          if (res.success && res.data) setFormDef(res.data);
        })
        .catch(() => {});
    }

    const loadRels = async () => {
      try {
        const res = await relationshipService.getByFormId(slug as string);
        if (res.success && res.data) setRelationships(res.data);
      } catch { /* ignore */ }
    };
    loadRels();
  }, [slug]);

  /* ---------------- Actions ---------------- */

  const handleDelete = async (recordId: string) => {
    const isConfirmed = await showPopup({
      type: "confirm",
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this record? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!isConfirmed) return;

    setDeletingId(recordId);
    try {
      const res = await formService.deleteDynamicSubmission(slug as string, recordId);
      if (res.success) {
        setRows((prev) => prev.filter((row) => row._id !== recordId));
        setPagination((prev) => (prev ? { ...prev, total: Math.max(prev.total - 1, 0) } : prev));
      } else {
        await showPopup({ title: "Error", message: res.message || "Failed to delete record." });
      }
    } catch (err: any) {
      await showPopup({ title: "Error", message: err.message || "An error occurred while deleting." });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row._id));

  const headerCheckboxRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = selectedIds.size > 0 && !allOnPageSelected;
    },
    [selectedIds, allOnPageSelected]
  );

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((row) => next.delete(row._id));
      else rows.forEach((row) => next.add(row._id));
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const isConfirmed = await showPopup({
      type: "confirm",
      title: "Delete Multiple Records",
      message: `Are you sure you want to permanently delete ${ids.length} record(s)? This action cannot be undone.`,
      confirmText: `Delete ${ids.length}`,
      cancelText: "Cancel"
    });

    if (!isConfirmed) return;

    setIsBulkDeleting(true);
    try {
      const res = await formService.bulkDeleteSubmissions(slug as string, ids);
      if (res.success) {
        setRows((prev) => prev.filter((row) => !selectedIds.has(row._id)));
        setPagination((prev) =>
          prev ? { ...prev, total: Math.max(prev.total - (res.data?.deletedCount ?? 0), 0) } : prev
        );
        clearSelection();
      } else {
        await showPopup({ title: "Error", message: res.message || "Failed to delete records." });
      }
    } catch (err: any) {
      await showPopup({ title: "Error", message: err.message || "An error occurred while deleting records." });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openFilters = () => {
    setDraftFilters(filterValues);
    setShowFilters((prev) => !prev);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (scope: "filtered" | "selected") => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const blob = await formService.exportSubmissionsCsv(slug as string, {
        search,
        sortField,
        sortOrder,
        filters: filterValues,
        ids: scope === "selected" ? Array.from(selectedIds) : undefined,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${slug}-submissions-${stamp}.csv`);
    } catch (err: any) {
      await showPopup({ title: "Export Failed", message: err.message || "Could not export records." });
    } finally {
      setIsExporting(false);
    }
  };

  const applyFilters = () => {
    setFilterValues(draftFilters);
    setShowFilters(false);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters({});
    setFilterValues({});
    setShowFilters(false);
    setPage(1);
  };

  const removeFilterChip = (key: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  };

  const activeFilterCount = Object.values(filterValues).filter((v) => String(v).trim() !== "").length;

  const filterableColumns = columns.filter(
    (col) => col.type !== "file"
  );

  const chipMetaFor = (key: string): { label: string; value: string } | null => {
    const raw = filterValues[key];
    if (raw === undefined || String(raw).trim() === "") return null;

    if (key === "createdFrom") return { label: "Created From", value: raw };
    if (key === "createdTo") return { label: "Created To", value: raw };

    const numMatch = key.match(/^num(Min|Max)_(.+)$/);
    if (numMatch) {
      const col = columns.find((c) => c.key === numMatch[2]);
      return { label: `${col?.label || numMatch[2]} ${numMatch[1] === "Min" ? "≥" : "≤"}`, value: raw };
    }

    const col = columns.find((c) => c.key === key.replace(/^f_/, ""));
    const option = col?.options?.find((o) => String(o.value) === raw);
    return { label: col?.label || key.replace(/^f_/, ""), value: option ? String(option.label) : raw };
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortField !== columnKey) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortOrder === "asc"
      ? <ArrowUp size={12} className="text-indigo-600" />
      : <ArrowDown size={12} className="text-indigo-600" />;
  };

  /* ---------------- Related records helpers (preserved) ---------------- */

  const getRelatedSections = (data: Record<string, any>) => {
    if (!data) return [];
    return Object.entries(data).filter(([key]) => key.endsWith('_rel'));
  };

  /* ---------------- Pagination helpers ---------------- */

  const totalPages = pagination?.pages || 1;
  const pageWindow = useMemo(() => {
    const span = 5;
    let start = Math.max(1, page - Math.floor(span / 2));
    const end = Math.min(totalPages, start + span - 1);
    start = Math.max(1, end - span + 1);
    const list: number[] = [];
    for (let p = start; p <= end; p++) list.push(p);
    return list;
  }, [page, totalPages]);

  const totalRecords = pagination?.total ?? 0;
  const rangeStart = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalRecords);

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600 w-8 h-8 md:w-10 md:h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/forms")} className="text-xs md:text-sm">
          <ArrowLeft size={14} className="mr-2" />
          <span className="hidden sm:inline">Back to Forms</span>
          <span className="sm:hidden">Back</span>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Submitted Data: <span className="text-indigo-600">{slug}</span></h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2">Each row can be opened in edit mode.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold">
            {error}
          </div>
        )}

        {/* Toolbar: search + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search records..."
              className="w-full min-h-11 pl-11 pr-9 rounded-xl border-2 border-gray-100 bg-white text-sm font-medium text-gray-700 outline-none focus:border-indigo-600 focus:shadow-[0_10px_30px_rgb(79,70,229,0.08)] transition-all placeholder:text-gray-300"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button variant={activeFilterCount > 0 ? "primary" : "outline"} size="sm" onClick={openFilters}>
            <SlidersHorizontal size={14} className="mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeFilterCount > 0 ? "bg-white/25" : "bg-indigo-50 text-indigo-600"}`}>
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (selectedIds.size > 0 ? setShowExportMenu((prev) => !prev) : handleExport("filtered"))}
              isLoading={isExporting}
            >
              <Download size={14} className="mr-2" />
              Export CSV
            </Button>
            {showExportMenu && selectedIds.size > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-1.5 z-40">
                  <button
                    onClick={() => handleExport("selected")}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                  >
                    Selected records only ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleExport("filtered")}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                  >
                    Current filtered view{totalRecords > 0 ? ` (${totalRecords})` : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter popover */}
        {showFilters && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">Filters</p>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filterableColumns.map((col) => {
                const isExact = EXACT_FILTER_TYPES.has(col.type || "");
                const isNumeric = numericColumnKeys.has(col.key);

                if (isExact && col.options && col.options.length > 0) {
                  return (
                    <div key={col.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{col.label}</label>
                      <select
                        value={draftFilters[`f_${col.key}`] || ""}
                        onChange={(e) =>
                          setDraftFilters((prev) => {
                            const next = { ...prev };
                            if (e.target.value) next[`f_${col.key}`] = e.target.value;
                            else delete next[`f_${col.key}`];
                            return next;
                          })
                        }
                        className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all cursor-pointer"
                      >
                        <option value="">Any</option>
                        {col.options.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (isNumeric) {
                  return (
                    <div key={col.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{col.label} (min – max)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={draftFilters[`numMin_${col.key}`] || ""}
                          onChange={(e) =>
                            setDraftFilters((prev) => {
                              const next = { ...prev };
                              if (e.target.value) next[`numMin_${col.key}`] = e.target.value;
                              else delete next[`numMin_${col.key}`];
                              return next;
                            })
                          }
                          className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all"
                        />
                        <span className="text-gray-300 text-xs shrink-0">–</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={draftFilters[`numMax_${col.key}`] || ""}
                          onChange={(e) =>
                            setDraftFilters((prev) => {
                              const next = { ...prev };
                              if (e.target.value) next[`numMax_${col.key}`] = e.target.value;
                              else delete next[`numMax_${col.key}`];
                              return next;
                            })
                          }
                          className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={col.key} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{col.label}</label>
                    <input
                      value={draftFilters[`f_${col.key}`] || ""}
                      onChange={(e) =>
                        setDraftFilters((prev) => {
                          const next = { ...prev };
                          if (e.target.value.trim()) next[`f_${col.key}`] = e.target.value;
                          else delete next[`f_${col.key}`];
                          return next;
                        })
                      }
                      placeholder="Contains..."
                      className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all placeholder:text-gray-300"
                    />
                  </div>
                );
              })}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Created From</label>
                <input
                  type="date"
                  value={draftFilters["createdFrom"] || ""}
                  onChange={(e) =>
                    setDraftFilters((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next["createdFrom"] = e.target.value;
                      else delete next["createdFrom"];
                      return next;
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Created To</label>
                <input
                  type="date"
                  value={draftFilters["createdTo"] || ""}
                  onChange={(e) =>
                    setDraftFilters((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next["createdTo"] = e.target.value;
                      else delete next["createdTo"];
                      return next;
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl border-2 border-gray-100 bg-white text-xs font-medium text-gray-700 outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear All</Button>
              <Button variant="primary" size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(filterValues).map((key) => {
              const meta = chipMetaFor(key);
              if (!meta) return null;
              return (
                <button
                  key={key}
                  onClick={() => removeFilterChip(key)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full pl-3 pr-2 py-1 text-[11px] font-bold hover:bg-indigo-100 transition-all"
                >
                  <span className="text-indigo-400">{meta.label}:</span> {meta.value}
                  <X size={12} className="text-indigo-400" />
                </button>
              );
            })}
          </div>
        )}

        <ManageRelationsModal
          isOpen={!!relModalRecordId}
          onClose={() => setRelModalRecordId(null)}
          recordId={relModalRecordId || ""}
          slug={slug as string}
          relationships={relationships}
          onUpdated={() => {
            loadData();
          }}
        />

        {!rows.length ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 text-gray-500 text-sm">
            {search || activeFilterCount > 0
              ? "No records match your current search or filters."
              : "No submissions found for this view yet."}
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-3 w-8"></th>
                      <th className="text-left px-3 py-3 w-10">
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">
                        <button onClick={() => toggleSort("_id")} className="inline-flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-gray-400 hover:text-gray-600 transition-colors">
                          Record ID <SortIcon columnKey="_id" />
                        </button>
                      </th>
                      {columns.map((col) => (
                        <th key={col.key} className="text-left px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleSort(col.key)}
                            title={col.key}
                            className="inline-flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {col.label} <SortIcon columnKey={col.key} />
                          </button>
                        </th>
                      ))}
                      <th className="text-left px-4 py-3 whitespace-nowrap">
                        <button onClick={() => toggleSort("createdAt")} className="inline-flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-gray-400 hover:text-gray-600 transition-colors">
                          Created <SortIcon columnKey="createdAt" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const relatedEntries = getRelatedSections(row.data);
                      const hasRelated = relatedEntries.length > 0;
                      const isExpanded = expandedRows.has(row._id);
                      return (
                        <React.Fragment key={row._id}>
                          <tr className="border-t border-gray-100 align-top">
                            <td className="px-2 py-3">
                              {hasRelated && (
                                <button
                                  onClick={() => {
                                    setExpandedRows(prev => {
                                      const next = new Set(prev);
                                      if (next.has(row._id)) next.delete(row._id);
                                      else next.add(row._id);
                                      return next;
                                    });
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="text-gray-400" />}
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(row._id)}
                                onChange={() => toggleSelectRow(row._id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{row._id.slice(-8)}</td>
                            {columns.map((col) => (
                              <td key={col.key} className="px-4 py-3 text-gray-700 max-w-[220px] truncate">
                                <FileDisplay value={getFieldValue(row, col)} compact />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                              {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {relationships.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRelModalRecordId(row._id)}
                                  >
                                    <Link2 size={14} className="mr-2" />
                                    Relations
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/view/${slug}?editId=${row._id}`)}
                                >
                                  <Edit2 size={14} className="mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 border-red-100 hover:bg-red-50 hover:border-red-300"
                                  onClick={() => handleDelete(row._id)}
                                  isLoading={deletingId === row._id}
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && hasRelated && (
                            <tr key={`${row._id}-related`} className="bg-indigo-50/30">
                              <td colSpan={columns.length + 6} className="px-6 py-4">
                                <div className="space-y-3">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Related Records</p>
                                  {relatedEntries.map(([key, relData]) => {
                                    const label = key.replace(/^section_|_rel$/g, '').replace(/_/g, ' ');
                                    return (
                                    <div key={key} className="bg-white rounded-xl p-4 border border-indigo-100">
                                      <p className="text-[11px] font-black text-gray-700 mb-2 uppercase">{label}</p>
                                      {Array.isArray(relData) ? (
                                        relData.length > 0 ? (
                                          <div className="space-y-2">
                                            {relData.map((item: any, i: number) => (
                                              <div key={i} className="bg-gray-50 rounded-lg p-2 space-y-1">
                                                {Object.entries(item.data || item)
                                                  .filter(([fk]) => !fk.endsWith('_rel'))
                                                  .map(([fk, fv]: [string, any]) => (
                                                  <div key={fk} className="flex items-start gap-2">
                                                    <span className="text-[9px] font-mono text-gray-400 shrink-0 mt-0.5">{fk}:</span>
                                                    <FileDisplay value={fv} compact />
                                                  </div>
                                                ))}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-gray-400 italic">No related records</p>
                                        )
                                      ) : (
                                        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                                          {Object.entries(relData?.data || relData)
                                            .filter(([fk]) => !fk.endsWith('_rel'))
                                            .map(([fk, fv]: [string, any]) => (
                                            <div key={fk} className="flex items-start gap-2">
                                              <span className="text-[9px] font-mono text-gray-400 shrink-0 mt-0.5">{fk}:</span>
                                              <FileDisplay value={fv} compact />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {rows.map((row) => (
                  <div key={row._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row._id)}
                          onChange={() => toggleSelectRow(row._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer shrink-0"
                        />
                        <span className="font-mono text-xs text-gray-500 truncate">
                          {row._id.slice(-8)}
                        </span>
                      </label>
                      <div className="text-[10px] text-gray-400 shrink-0">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 space-y-1">
                      {columns.slice(0, 4).map((col) => {
                        const v = getFieldValue(row, col);
                        if (v === undefined || v === null || v === "") return null;
                        return (
                          <div key={col.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-mono text-[10px] text-gray-400">{col.label}:</span>
                            <FileDisplay value={v} compact />
                          </div>
                        );
                      })}
                    </div>

                    {(() => {
                      const mobileRelated = getRelatedSections(row.data);
                      return mobileRelated.length > 0 ? (
                        <div className="bg-indigo-50/50 rounded-xl p-3 space-y-2">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Related</p>
                          {mobileRelated.map(([key, relData]) => {
                            const label = key.replace(/^section_|_rel$/g, '').replace(/_/g, ' ');
                            return (
                            <div key={key} className="text-[9px] text-gray-600">
                              <span className="font-bold">{label}: </span>
                              {Array.isArray(relData) ? `${relData.length} records` : "1 record"}
                            </div>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}

                    <div className="flex items-center gap-2">
                      {relationships.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => setRelModalRecordId(row._id)}
                        >
                          <Link2 size={12} className="mr-1" />
                          Relations
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => router.push(`/view/${slug}?editId=${row._id}`)}
                      >
                        <Edit2 size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs text-red-500 border-red-100 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleDelete(row._id)}
                        isLoading={deletingId === row._id}
                      >
                        <Trash2 size={12} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <p className="text-[11px] font-bold text-gray-400">
                  Showing {rangeStart}–{rangeEnd} of {totalRecords}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="h-9 px-2 rounded-lg border-2 border-gray-100 bg-white text-[11px] font-bold text-gray-600 outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="p-2 rounded-lg border-2 border-gray-100 bg-white text-gray-500 disabled:opacity-40 disabled:pointer-events-none hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                {pageWindow.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-9 h-9 px-2 rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]"
                        : "bg-white border-2 border-gray-100 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="p-2 rounded-lg border-2 border-gray-100 bg-white text-gray-500 disabled:opacity-40 disabled:pointer-events-none hover:border-indigo-300 hover:text-indigo-600 transition-all rotate-180"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Floating bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
            <div className="bg-gray-900 text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs font-black whitespace-nowrap">
                {selectedIds.size} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  disabled={isBulkDeleting}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Clear
                </button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleBulkDelete}
                  isLoading={isBulkDeleting}
                  className="!min-h-9 !px-3"
                >
                  <Trash2 size={13} className="mr-1.5" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmissionListPage() {
  return (
    <ProtectedRoute>
      <SubmissionListPageContent />
    </ProtectedRoute>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formService } from "../../../services/form.service";
import Button from "../../../components/common/Button";
import { usePopup } from "../../../contexts/PopupContext";
import { ArrowLeft, Edit2, Trash2, Loader2, ChevronDown, ChevronRight, Link2 } from "lucide-react";
import { Relationship } from "../../../types/relationship.types";
import { relationshipService } from "../../../services/relationship.service";
import ManageRelationsModal from "../../../components/relationships/ManageRelationsModal";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

type SubmissionRow = {
  _id: string;
  data: Record<string, any>;
  createdAt?: string;
};

function SubmissionListPageContent() {
  const { slug } = useParams();
  const router = useRouter();
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relModalRecordId, setRelModalRecordId] = useState<string | null>(null);
  const { showPopup } = usePopup();

  const getRelatedSections = (data: Record<string, any>) => {
    if (!data) return [];
    return Object.entries(data).filter(([key]) => key.endsWith('_rel'));
  };

  const flattenData = (data: Record<string, any>) => {
    if (!data) return {};
    const fieldEntries = Object.entries(data).filter(([key]) => !key.endsWith('_rel'));
    const isNested = fieldEntries.some(([_, v]) => 
      v !== null && typeof v === 'object' && !Array.isArray(v)
    );
    if (!isNested) {
      const flat: Record<string, any> = {};
      fieldEntries.forEach(([k, v]) => { flat[k] = v; });
      return flat;
    }
    const flat: Record<string, any> = {};
    fieldEntries.forEach(([_, sVal]) => {
       if (typeof sVal === 'object' && sVal !== null) Object.assign(flat, sVal);
    });
    return flat;
  };

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
      } else {
        await showPopup({ title: "Error", message: res.message || "Failed to delete record." });
      }
    } catch (err: any) {
      await showPopup({ title: "Error", message: err.message || "An error occurred while deleting." });
    } finally {
      setDeletingId(null);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const res = await formService.listDynamicSubmissions(slug as string, 1, 20);
      if (res.success && res.data) {
        setRows(res.data);
      } else {
        setError(res.message || "Could not load submissions.");
      }
    } catch (err: any) {
      setError(err.message || "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) loadData();

    const loadRels = async () => {
      try {
        const res = await relationshipService.getByFormId(slug as string);
        if (res.success && res.data) setRelationships(res.data);
      } catch { /* ignore */ }
    };
    loadRels();
  }, [slug, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600 w-8 h-8 md:w-10 md:h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
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
            No submissions found for this view yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 py-3 w-8"></th>
                  <th className="text-left px-4 py-3">Record ID</th>
                  <th className="text-left px-4 py-3">Preview</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const relatedEntries = getRelatedSections(row.data);
                  const hasRelated = relatedEntries.length > 0;
                  const isExpanded = expandedRows.has(row._id);
                  return (
                    <React.Fragment key={row._id}>
                      <tr className="border-t border-gray-100">
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
                        <td className="px-4 py-3 font-mono text-xs">{row._id}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {(() => {
                            const flat = flattenData(row.data);
                            return Object.entries(flat)
                              .slice(0, 3)
                              .map(([fk, fv]) => {
                                const displayVal = Array.isArray(fv) 
                                  ? fv.map(item => String(item)).join(", ")
                                  : String(fv);
                                return `${fk}: ${displayVal}`;
                              })
                              .join(" | ");
                          })()}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
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
                          <td colSpan={5} className="px-6 py-4">
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
                                          <div key={i} className="text-[10px] text-gray-600 font-mono bg-gray-50 rounded-lg p-2">
                                            {JSON.stringify(item.data || item).slice(0, 200)}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-gray-400 italic">No related records</p>
                                    )
                                  ) : (
                                    <div className="text-[10px] text-gray-600 font-mono bg-gray-50 rounded-lg p-2">
                                      {JSON.stringify(relData?.data || relData).slice(0, 200)}
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
                    <div className="font-mono text-xs text-gray-500 truncate flex-1">
                      {row._id}
                    </div>
                    <div className="text-[10px] text-gray-400 shrink-0">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 truncate">
                    {(() => {
                      const flat = flattenData(row.data);
                      return Object.entries(flat)
                        .slice(0, 2)
                        .map(([fk, fv]) => {
                          const displayVal = Array.isArray(fv) 
                            ? fv.map(item => String(item)).join(", ")
                            : String(fv);
                          return `${fk}: ${displayVal}`;
                        })
                        .join(" | ");
                    })()}
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

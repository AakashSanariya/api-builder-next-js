"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formService } from "../../../services/form.service";
import Button from "../../../components/common/Button";
import { ArrowLeft, Edit2, Trash2, Loader2 } from "lucide-react";

type SubmissionRow = {
  _id: string;
  data: Record<string, any>;
  createdAt?: string;
};

export default function SubmissionListPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;

    setDeletingId(recordId);
    try {
      const res = await formService.deleteDynamicSubmission(slug as string, recordId);
      if (res.success) {
        setRows((prev) => prev.filter((row) => row._id !== recordId));
      } else {
        alert(res.message || "Failed to delete record.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await formService.listDynamicSubmissions(slug as string);
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
    };

    if (slug) loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Button variant="outline" size="sm" onClick={() => router.push("/forms")}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Forms
        </Button>

        <div>
          <h1 className="text-3xl font-black text-gray-900">Submitted Data: {slug}</h1>
          <p className="text-gray-500 text-sm mt-2">Each row can be opened in edit mode.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm font-bold">
            {error}
          </div>
        )}

        {!rows.length ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-gray-500">
            No submissions found for this view yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Record ID</th>
                  <th className="text-left px-4 py-3">Preview</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-xs">{row._id}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {Object.entries(row.data || {})
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                        .join(" | ")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

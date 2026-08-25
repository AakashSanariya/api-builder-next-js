"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Layers,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Button from "../../components/common/Button";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { analyticsService } from "../../services/analytics.service";
import { AnalyticsOverview, AnalyticsRange } from "../../types/analytics.types";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

function KpiCard({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
      {footer && <div className="text-[11px] font-bold">{footer}</div>}
    </div>
  );
}

function AnalyticsContent() {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsRange>(30);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (selectedRange: AnalyticsRange) => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsService.getOverview(selectedRange);
      if (res.success && res.data) {
        setOverview(res.data);
      } else {
        setError(res.message || "Could not load analytics.");
      }
    } catch (err: any) {
      setError(err.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(range);
  }, [range, loadOverview]);

  const totals = overview?.totals;
  const delta =
    totals && totals.previous7Days > 0
      ? Math.round(((totals.last7Days - totals.previous7Days) / totals.previous7Days) * 100)
      : null;

  if (loading && !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-indigo-600 w-8 h-8 md:w-10 md:h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2">
              Submission activity across all your API schemas.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white border-2 border-gray-100 rounded-xl p-1 self-start sm:self-auto">
            {RANGES.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all ${
                  range === option.value
                    ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.35)]"
                    : "text-gray-500 hover:text-indigo-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold">
            {error}
          </div>
        )}

        {!error && totals && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <KpiCard icon={Layers} label="Total APIs" value={totals.forms} />
              <KpiCard
                icon={Globe}
                label="Published"
                value={totals.publishedForms}
                footer={
                  <span className="text-gray-400">
                    {totals.forms > 0
                      ? `${Math.round((totals.publishedForms / totals.forms) * 100)}% of your schemas`
                      : "No schemas yet"}
                  </span>
                }
              />
              <KpiCard icon={Activity} label="Total Submissions" value={totals.submissions} />
              <KpiCard
                icon={TrendingUp}
                label="Last 7 Days"
                value={totals.last7Days}
                footer={
                  delta === null ? (
                    totals.last7Days > 0 ? (
                      <span className="text-emerald-500">New activity</span>
                    ) : (
                      <span className="text-gray-400">No recent activity</span>
                    )
                  ) : delta >= 0 ? (
                    <span className="text-emerald-500 inline-flex items-center gap-1">
                      <TrendingUp size={12} /> +{delta}% vs previous week
                    </span>
                  ) : (
                    <span className="text-red-500 inline-flex items-center gap-1">
                      <TrendingDown size={12} /> {delta}% vs previous week
                    </span>
                  )
                }
              />
            </div>

            {/* Timeline chart */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Submissions — last {range} days
                </p>
                {loading && <Loader2 size={14} className="animate-spin text-indigo-400" />}
              </div>
              <div className="h-64 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.timeline} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                      tickLine={false}
                      axisLine={{ stroke: "#f1f5f9" }}
                      interval="preserveStartEnd"
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #eef2ff",
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value) => [`${Number(value)} submission${Number(value) === 1 ? "" : "s"}`, ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#submissionGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-form table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Per-API Breakdown
                </p>
              </div>
              {overview.perForm.length === 0 ? (
                <div className="p-6 md:p-8 text-sm text-gray-500">
                  No API schemas yet.{" "}
                  <button onClick={() => router.push("/forms")} className="text-indigo-600 font-bold hover:underline">
                    Create your first schema
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">API Schema</th>
                        <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">Status</th>
                        <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">All Time</th>
                        <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">Last {range}D</th>
                        <th className="text-left px-4 py-3 font-black uppercase text-[10px] tracking-wider text-gray-400">Last Submission</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.perForm.map((form) => (
                        <tr key={form.formId} className="border-t border-gray-100 hover:bg-indigo-50/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-black text-gray-800 text-xs md:text-sm">{form.name}</p>
                            <p className="font-mono text-[10px] text-gray-400 mt-0.5">/{form.slug}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                form.published
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${form.published ? "bg-emerald-500" : "bg-gray-300"}`} />
                              {form.published ? "Live" : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-black text-gray-700">{form.total}</td>
                          <td className="px-4 py-3.5 font-bold text-gray-500">{form.inRange}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {form.lastSubmissionAt ? new Date(form.lastSubmissionAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/submissions/${form.slug}`)}>
                              View Data
                              <ArrowRight size={13} className="ml-1.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

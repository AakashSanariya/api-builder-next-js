"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { formService } from "../../../services/form.service";
import { FieldSchema } from "../../../types/field.types";
import FieldRenderer from "../../../components/renderer/FieldRenderer";
import Button from "../../../components/common/Button";
import { Loader2, AlertCircle, CheckCircle2, Zap, ArrowRight, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";

function PublicFormViewContent() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const editRecordId = searchParams.get("editId") || searchParams.get("id");

  const buildInitialData = (sections: any[]) => {
    const initialData: Record<string, any> = {};
    const allFields = sections.flatMap(s => s.fields || []);
    allFields.forEach((field: FieldSchema) => {
      if (field.type === "checkbox") initialData[field.name] = [];
      else if (field.type === "file") initialData[field.name] = [];
      else if (field.type === "button" || field.type === "link") return;
      else initialData[field.name] = "";
    });
    return initialData;
  };

  const flattenSubmissionData = (data: Record<string, any>) => {
    if (!data) return {};
    const isNested = Object.values(data).some(v =>
      v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof File)
    );
    if (!isNested) return data;
    const flat: Record<string, any> = {};
    Object.values(data).forEach(sectionValues => {
      if (typeof sectionValues === 'object' && sectionValues !== null) {
        Object.assign(flat, sectionValues);
      }
    });
    return flat;
  };

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const formRes = await formService.getFormBySlug(slug as string);

        if (formRes.success && formRes.data) {
          const formResolved = formRes.data;
          if (!formResolved.sections || formResolved.sections.length === 0) {
            formResolved.sections = [{ id: 'default', title: '', fields: formResolved.fields || [] }];
          }
          setForm(formResolved);
          const initialData = buildInitialData(formResolved.sections);
          setFormData(initialData);

          if (editRecordId) {
            const existing = await formService.getDynamicSubmissionById(slug as string, editRecordId);
            if (existing.success && existing.data?.data) {
              const flatData = flattenSubmissionData(existing.data.data);
              const mergedData = { ...initialData, ...flatData };
              setFormData(mergedData);
            } else {
              setFormData(initialData);
            }
          }
        } else {
          setErrorMsg("The requested form could not be found.");
        }
      } catch (err) {
        setErrorMsg("System error while retrieving form schema.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchForm();
  }, [slug, editRecordId]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setValidationErrors({});

    try {
      const payload: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        payload[key] = value;
      });

      const hasFiles = Object.values(payload).some(
        (v) =>
          (Array.isArray(v) && v.some((item) => item instanceof File)) ||
          v instanceof File
      );

      let result;
      if (editRecordId || hasFiles) {
        const formDataObj = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value instanceof File) {
            formDataObj.append(key, value);
          } else if (Array.isArray(value)) {
            value.forEach((item) => formDataObj.append(key, item));
          } else {
            formDataObj.append(key, value);
          }
        });
        result = editRecordId
          ? await formService.updateDynamicSubmission(slug as string, editRecordId, formDataObj)
          : await formService.submitDynamicForm(slug as string, formDataObj);
      } else {
        result = await formService.submitDynamicFormJSON(slug as string, payload);
      }

      if (result.success) {
        setStatus("success");
        if (!editRecordId && form?.sections) {
          setFormData(buildInitialData(form.sections));
        }
      } else if (result.errors) {
        setValidationErrors(result.errors);
        setStatus("error");
        setErrorMsg(result.message || "Please resolve the validation errors.");
      } else {
        throw new Error(result.message || "Failed to submit data.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="text-primary" size={48} />
        </motion.div>
        <p className="mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Initializing Secure Engine</p>
      </div>
    );
  }

  if (!form || !form.published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-10 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-12 rounded-[3rem] shadow-2xl border border-border max-w-md">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[1.5rem] flex items-center justify-center mb-8 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-foreground font-display tracking-tight mb-4">{!form ? "404: Not Found" : "Not Accessible"}</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-8 leading-relaxed">
            {!form
              ? "The form entity requested does not exist on our network."
              : "This schema is currently in draft mode and not accepting public traffic."}
          </p>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => router.push("/forms")}>
            Return to Base
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 md:py-20 px-3 md:px-4 flex justify-center items-start overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-card rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-border overflow-hidden">
          <header className="px-6 md:px-12 pt-10 md:pt-16 pb-8 md:pb-12 text-center border-b border-border bg-muted backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-card rounded-full border shadow-sm mb-4 md:mb-6">
              <Zap size={12} className="text-primary" />
              <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Security Verified</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-foreground font-display tracking-tight leading-none mb-3 md:mb-4 italic">
              {form.name}
            </h1>
            <p className="text-muted-foreground font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em]">Secure Data Intake Portal</p>
          </header>

          <div className="p-6 md:p-12">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 md:py-10"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-emerald-50 text-emerald-500 rounded-[1.5rem] md:rounded-[2rem] mb-8 md:mb-10 shadow-xl shadow-emerald-50">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground font-display tracking-tight mb-3 md:mb-4 leading-none">
                    {editRecordId ? "Update Success" : "Transmission Success"}
                  </h2>
                  <p className="text-muted-foreground font-bold uppercase text-xs tracking-wider mb-8 md:mb-12">
                    {editRecordId
                      ? "Your prefilled data has been updated and stored."
                      : "Your data has been successfully validated and stored."}
                  </p>
                  <Button variant="primary" size="lg" className="w-full" onClick={() => setStatus("idle")}>
                    Submit Another Response
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" className="w-full mt-3 md:mt-4" onClick={() => router.push(`/submissions/${slug}`)}>
                    <List size={16} className="mr-2" />
                    View Submissions
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
                  {status === "error" && !Object.keys(validationErrors).length && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] md:text-[11px] font-bold text-red-500 px-2 flex items-center gap-1 font-display"
                    >
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      {errorMsg}
                    </motion.div>
                  )}

                  <div className="space-y-10 md:space-y-16">
                    {form.sections?.map((section: any) => (
                      <div key={section.id} className="space-y-6 md:space-y-8">
                        {section.title && (
                          <div className="flex items-center gap-3 md:gap-4 px-2">
                            <h3 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] font-display whitespace-nowrap">
                              {section.title}
                            </h3>
                            <div className="h-px w-full bg-gradient-to-r from-primary/20 to-transparent" />
                          </div>
                        )}
                        <div className="space-y-8 md:space-y-10">
                          {section.fields.map((field: any) => (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              value={formData[field.name]}
                              onChange={(val) => handleFieldChange(field.name, val)}
                              error={validationErrors[field.name]}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 md:pt-10 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button type="button" variant="outline" size="lg" className="w-full py-5 md:py-6 text-base md:text-lg rounded-xl md:rounded-[2rem] border-border text-muted-foreground hover:text-muted-foreground hover:bg-muted" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button type="submit" size="lg" className="w-full py-5 md:py-6 text-base md:text-lg rounded-xl md:rounded-[2rem]" isLoading={submitting}>
                      {editRecordId ? "Sync Changes" : "Confirm Submission"}
                      <ArrowRight size={18} className="ml-2 md:ml-3" />
                    </Button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>

          <footer className="px-6 md:px-12 py-6 md:py-8 bg-muted border-t border-border text-center">
            <p className="text-[8px] md:text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">
              Developed by Aakash Sanariya
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

export default function PublicFormView() {
  return (
    <ProtectedRoute>
      <PublicFormViewContent />
    </ProtectedRoute>
  );
}

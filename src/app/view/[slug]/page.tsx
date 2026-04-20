"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formService } from "../../../services/form.service";
import { FormModel } from "../../../types/form.types";
import { FieldSchema } from "../../../types/field.types";
import FieldRenderer from "../../../components/renderer/FieldRenderer";
import Button from "../../../components/common/Button";
import { Loader2, AlertCircle, CheckCircle2, ChevronLeft, Zap, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicFormView() {
  const { slug } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<FormModel | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await formService.getFormBySlug(slug as string);
        if (res.success && res.data) {
          setForm(res.data);
          // Initialize form data
          const initialData: Record<string, any> = {};
          res.data.fields.forEach((field: FieldSchema) => {
            if (field.type === "checkbox") initialData[field.name] = [];
            else if (field.type === "file") initialData[field.name] = [];
            else if (field.type === "button" || field.type === "link") return;
            else initialData[field.name] = "";
          });
          setFormData(initialData);
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
  }, [slug]);

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
      const submissionData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item instanceof File) {
                submissionData.append(key, item);
            } else {
                submissionData.append(key, item); // Multer handles repeated keys as array
            }
          });
        } else {
          submissionData.append(key, value);
        }
      });

      const result = await formService.submitDynamicForm(slug as string, submissionData);

      if (result.success) {
        setStatus("success");
        setFormData({});
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFEFE]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Loader2 className="text-indigo-600" size={48} />
        </motion.div>
        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Initializing Secure Engine</p>
      </div>
    );
  }

  if (!form || !form.published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-10 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-md">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[1.5rem] flex items-center justify-center mb-8 mx-auto">
                <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 font-display tracking-tight mb-4">{!form ? "404: Not Found" : "Not Accessible"}</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-8 leading-relaxed">
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
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 flex justify-center items-start overflow-x-hidden">
      {/* Decorative Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
          {/* Form Header */}
          <header className="px-12 pt-16 pb-12 text-center border-b border-gray-50 bg-gray-50/20 backdrop-blur-sm">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm mb-6">
                <Zap size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Security Verified</span>
             </div>
             <h1 className="text-4xl font-black text-gray-900 font-display tracking-tight leading-none mb-4 italic">
                {form.name}
             </h1>
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Secure Data Intake Portal</p>
          </header>

          <div className="p-12">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] mb-10 shadow-xl shadow-emerald-50">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight mb-4 leading-none">Transmission Success</h2>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-12">Your data has been successfully validated and stored.</p>
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="w-full"
                    onClick={() => setStatus("idle")}
                  >
                    Submit Another Response
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  {status === "error" && !Object.keys(validationErrors).length && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700"
                    >
                      <AlertCircle className="shrink-0" size={24} />
                      <p className="text-xs font-black uppercase tracking-tight">{errorMsg}</p>
                    </motion.div>
                  )}

                  <div className="space-y-12">
                    {form.fields.map((field) => (
                        <FieldRenderer
                        key={field.id}
                        field={field}
                        value={formData[field.name]}
                        onChange={(val) => handleFieldChange(field.name, val)}
                        error={validationErrors[field.name]}
                        />
                    ))}
                  </div>

                  <div className="pt-10">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full py-6 text-lg rounded-[2rem]"
                      isLoading={submitting}
                    >
                      Confirm Submission
                      <ArrowRight size={22} className="ml-3" />
                    </Button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
          
          <footer className="px-12 py-8 bg-gray-50/50 border-t border-gray-50 text-center">
             <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">
                Protected by Antigravity API Guard
             </p>
          </footer>
        </div>
        
        <div className="mt-8 flex justify-center">
            <button 
                onClick={() => router.push("/forms")}
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-colors"
            >
                <ChevronLeft size={16} />
                Access Control Console
            </button>
        </div>
      </motion.div>
    </div>
  );
}

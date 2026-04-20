"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../../services/form.service";
import { FormModel } from "../../../types/form.types";
import { Loader2, ArrowLeft, Copy, Check, Terminal, Globe, Code, Box, Info, Lock } from "lucide-react";
import Button from "../../../components/common/Button";

export default function ApiDocsPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await formService.getFormById(formId as string);
        if (res.success && res.data) {
          setForm(res.data);
        }
      } catch (err) {
        console.error(err);
        router.push("/forms");
      } finally {
        setLoading(false);
      }
    };

    if (formId) fetchForm();
  }, [formId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!form) return null;

  const baseUrl = "http://localhost:5000";
  const apiEndpoint = `${baseUrl}/api/${form.slug}`;
  
  const sampleRequest = {};
  form.fields.forEach(f => {
    if (f.type !== 'button') {
        // @ts-ignore
        sampleRequest[f.name] = f.type === 'file' ? 'File binary' : 'Sample value';
    }
  });

  const sampleResponse = {
    success: true,
    message: `Successfully processed submission for '${form.name}'`,
    data: sampleRequest,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-[#FDFEFE] py-16 px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="outline" size="sm" onClick={() => router.push("/forms")} className="mb-12 border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm">
            <ArrowLeft size={16} className="mr-2" />
            Control Center
            </Button>
        </motion.div>

        <header className="mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-6">
             <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <Terminal size={28} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">Developer Portal</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Integration interface for {form.name}</p>
             </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Documentation Detail */}
            <div className="lg:col-span-12 space-y-12">
                
                {/* Endpoint Section */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                          <Globe size={20} />
                       </div>
                       <h2 className="text-xl font-black text-gray-800 font-display">REST API Target</h2>
                    </div>

                    <div className="relative group">
                        <div className="flex items-center gap-4 bg-gray-950 text-white p-6 rounded-[2rem] font-mono text-sm overflow-hidden shadow-2xl group-hover:shadow-indigo-200 transition-shadow">
                            <span className="text-indigo-400 font-black px-3 py-1 bg-indigo-400/10 rounded-lg">POST</span>
                            <span className="flex-1 truncate tracking-tight text-gray-300">{apiEndpoint}</span>
                            <button 
                                onClick={() => copyToClipboard(apiEndpoint)} 
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white"
                            >
                                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    {!form.published && (
                    <div className="mt-8 p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-center gap-4">
                        <Lock size={20} className="text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-800 font-black uppercase tracking-wider leading-relaxed italic">
                            Status: <span className="text-amber-600">Restricted</span>. Publish the form in the builder to enable this endpoint.
                        </p>
                    </div>
                    )}
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Request Payload Section */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                              <Code size={20} />
                           </div>
                           <h2 className="text-xl font-black text-gray-800 font-display">Body Format (JSON)</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-gray-50 p-8 rounded-[2rem] border border-gray-50 text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleRequest, null, 2)}
                            </pre>
                            <div className="absolute top-4 right-4 p-2 bg-white/50 rounded-lg backdrop-blur-sm border border-white/50 text-[9px] font-black uppercase text-gray-400">application/json</div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                                Use <span className="text-blue-900">multipart/form-data</span> for requests containing binary files.
                            </p>
                        </div>
                    </motion.section>

                    {/* Response Section */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                              <Box size={20} />
                           </div>
                           <h2 className="text-xl font-black text-gray-800 font-display">Success Response</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-gray-50 p-8 rounded-[2rem] border border-gray-50 text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleResponse, null, 2)}
                            </pre>
                             <div className="absolute top-4 right-4 p-2 bg-white/50 rounded-lg backdrop-blur-sm border border-white/50 text-[9px] font-black uppercase text-gray-400">200 OK</div>
                        </div>
                    </motion.section>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

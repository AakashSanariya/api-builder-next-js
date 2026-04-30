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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isCopied = (key: string) => copiedKey === key;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!form) return null;

  const baseUrl = "http://localhost:5000";
  const createEndpoint = `${baseUrl}/api/${form.slug}`;
  const listEndpoint = `${baseUrl}/api/${form.slug}/data?page=1&limit=20`;
  const byIdEndpoint = `${baseUrl}/api/${form.slug}/data/:recordId`;
  const deleteEndpoint = `${baseUrl}/api/${form.slug}/data/:recordId`;
  
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "_");
  };

  const buildsSampleRequest = () => {
    const request: Record<string, any> = {};
    
    // Normalize sections
    const sections = [...(form.sections || [])];
    if (sections.length === 0 && form.fields && form.fields.length > 0) {
      sections.push({ id: 'default', title: 'Default', fields: form.fields });
    }

    sections.forEach(section => {
      const sectionSlug = section.title ? slugify(section.title) : section.id;
      const key = `section_${sectionSlug}`;
      const sectionFields: Record<string, string> = {};
      
      section.fields.forEach(f => {
        if (f.type !== 'button') {
          sectionFields[f.name] = f.type === 'file' ? 'File binary' : 'Sample value';
        }
      });
      
      if (Object.keys(sectionFields).length > 0) {
        request[key] = sectionFields;
      }
    });
    
    return request;
  };

  const sampleRequest = buildsSampleRequest();

  const sampleResponse = {
    success: true,
    message: `Successfully processed submission for '${form.name}'`,
    data: sampleRequest,
    timestamp: new Date().toISOString()
  };

  const sampleListResponse = {
    success: true,
    data: [
      {
        _id: "record_id_1",
        formSlug: form.slug,
        formId: form._id,
        data: sampleRequest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    },
  };

  const sampleDeleteResponse = {
    success: true,
    message: `Successfully deleted submission for '${form.name}'`,
    timestamp: new Date().toISOString(),
  };

  // Check if any field is a file type
  const hasFileFields = (form.sections || []).length > 0
    ? form.sections!.some(s => s.fields.some(f => f.type === 'file'))
    : (form.fields || []).some(f => f.type === 'file');

  // Build cURL commands
  const NL = '\n';
  const CONT = ' \\';

  const flattenSampleForCurl = (obj: Record<string, any>) => {
    const flat: Record<string, string> = {};
    Object.values(obj).forEach(section => {
      if (typeof section === 'object' && section !== null) {
        Object.assign(flat, section);
      }
    });
    return flat;
  };

  const buildFormFlags = () => {
    const flat = flattenSampleForCurl(sampleRequest);
    return Object.entries(flat)
      .map(([k, v]) => (v === 'File binary' ? `  -F "${k}=@/path/to/file"` : `  -F "${k}=${v}"`))
      .join(CONT + NL);
  };

  const jsonBody = JSON.stringify(sampleRequest, null, 2);

  const curlPost = hasFileFields
    ? ['curl -X POST ' + createEndpoint, buildFormFlags()].join(CONT + NL)
    : ['curl -X POST ' + createEndpoint, '  -H "Content-Type: application/json"', "  -d '" + jsonBody + "'"].join(CONT + NL);

  const curlGetList = 'curl -X GET "' + listEndpoint + '"';

  const curlGetById = 'curl -X GET ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID';

  const curlPut = hasFileFields
    ? ['curl -X PUT ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', buildFormFlags()].join(CONT + NL)
    : ['curl -X PUT ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', '  -H "Content-Type: application/json"', "  -d '" + jsonBody + "'"].join(CONT + NL);

  const curlDelete = 'curl -X DELETE ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID';

  const curlCommands = [
    { label: 'Create Submission', method: 'POST', methodClass: 'text-indigo-500 bg-indigo-50 border-indigo-100', curl: curlPost, key: 'curl-post' },
    { label: 'List All Records', method: 'GET', methodClass: 'text-emerald-500 bg-emerald-50 border-emerald-100', curl: curlGetList, key: 'curl-get-list' },
    { label: 'Get Single Record', method: 'GET', methodClass: 'text-cyan-500 bg-cyan-50 border-cyan-100', curl: curlGetById, key: 'curl-get-id' },
    { label: 'Update Record', method: 'PUT', methodClass: 'text-amber-500 bg-amber-50 border-amber-100', curl: curlPut, key: 'curl-put' },
    { label: 'Delete Record', method: 'DELETE', methodClass: 'text-red-500 bg-red-50 border-red-100', curl: curlDelete, key: 'curl-delete' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFE] py-8 md:py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="outline" size="sm" onClick={() => router.push("/forms")} className="mb-8 md:mb-12 border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm text-xs md:text-sm">
            <ArrowLeft size={14} className="mr-2" />
            <span className="hidden sm:inline">Control Center</span>
            <span className="sm:hidden">Back</span>
            </Button>
        </motion.div>

        <header className="mb-10 md:mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
             <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <Terminal size={20} className="md:hidden" />
                <Terminal size={28} className="hidden md:block" />
             </div>
             <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight font-display truncate">Developer Portal</h1>
                <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] mt-0.5 md:mt-1 truncate">Integration interface for {form.name}</p>
             </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
            {/* Left: Documentation Detail */}
            <div className="lg:col-span-12 space-y-6 md:space-y-12">
                
                {/* Endpoint Section */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                       <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl shrink-0">
                          <Globe size={16} className="md:hidden" />
                          <Globe size={20} className="hidden md:block" />
                       </div>
                       <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">Available REST Endpoints</h2>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <div className="relative group">
                          <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-indigo-200 transition-shadow">
                              <span className="text-indigo-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-indigo-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">POST</span>
                              <span className="flex-1 truncate tracking-tight text-gray-300 min-w-0">{createEndpoint}</span>
                              <button
                                  onClick={() => copyToClipboard(createEndpoint, 'ep-post')}
                                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white shrink-0"
                              >
                                  {isCopied('ep-post') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                              </button>
                          </div>
                      </div>

                      <div className="relative group">
                          <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-indigo-200 transition-shadow">
                              <span className="text-emerald-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-emerald-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">GET</span>
                              <span className="flex-1 truncate tracking-tight text-gray-300 min-w-0">{listEndpoint}</span>
                              <button
                                  onClick={() => copyToClipboard(listEndpoint, 'ep-get-list')}
                                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white shrink-0"
                              >
                                  {isCopied('ep-get-list') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                              </button>
                          </div>
                      </div>

                      <div className="relative group">
                          <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-indigo-200 transition-shadow">
                              <span className="text-cyan-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-cyan-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">GET</span>
                              <span className="flex-1 truncate tracking-tight text-gray-300 min-w-0">{byIdEndpoint}</span>
                              <button
                                  onClick={() => copyToClipboard(byIdEndpoint, 'ep-get-id')}
                                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white shrink-0"
                              >
                                  {isCopied('ep-get-id') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                              </button>
                          </div>
                      </div>

                      <div className="relative group">
                          <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-indigo-200 transition-shadow">
                              <span className="text-amber-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-amber-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">PUT</span>
                              <span className="flex-1 truncate tracking-tight text-gray-300 min-w-0">{byIdEndpoint}</span>
                              <button
                                  onClick={() => copyToClipboard(byIdEndpoint, 'ep-put')}
                                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white shrink-0"
                              >
                                  {isCopied('ep-put') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                              </button>
                          </div>
                      </div>

                      <div className="relative group">
                          <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-red-200 transition-shadow">
                              <span className="text-red-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-red-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">DELETE</span>
                              <span className="flex-1 truncate tracking-tight text-gray-300 min-w-0">{deleteEndpoint}</span>
                              <button
                                  onClick={() => copyToClipboard(deleteEndpoint, 'ep-delete')}
                                  className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white shrink-0"
                              >
                                  {isCopied('ep-delete') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                              </button>
                          </div>
                      </div>
                    </div>

                    {!form.published && (
                    <div className="mt-6 md:mt-8 p-4 md:p-5 bg-amber-50 rounded-xl md:rounded-[1.5rem] border border-amber-100 flex items-start gap-3">
                        <Lock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] md:text-[11px] text-amber-800 font-black uppercase tracking-wider leading-relaxed italic">
                            Status: <span className="text-amber-600">Restricted</span>. Publish the form in the builder to enable this endpoint.
                        </p>
                    </div>
                    )}
                </motion.section>

                {/* cURL Commands Section */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                       <div className="p-2 md:p-3 bg-gray-900 text-white rounded-xl md:rounded-2xl shrink-0">
                          <Terminal size={16} className="md:hidden" />
                          <Terminal size={20} className="hidden md:block" />
                       </div>
                       <div className="min-w-0">
                         <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">cURL Commands</h2>
                         <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Ready to paste into terminal or import into Postman</p>
                       </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {curlCommands.map((cmd) => (
                        <div key={cmd.key} className="group">
                          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <span className={`font-black text-[8px] md:text-[10px] uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border ${cmd.methodClass}`}>{cmd.method}</span>
                            <span className="text-xs md:text-sm font-bold text-gray-700 truncate">{cmd.label}</span>
                          </div>
                          <div className="relative">
                            <pre className="bg-gray-950 text-gray-300 p-4 md:p-6 pr-12 md:pr-16 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-xl">{cmd.curl}</pre>
                            <button
                              onClick={() => copyToClipboard(cmd.curl, cmd.key)}
                              className="absolute top-3 md:top-4 right-3 md:right-4 p-2 md:p-3 bg-white/5 hover:bg-white/15 rounded-lg md:rounded-xl transition-all text-gray-500 hover:text-white border border-white/10"
                              title="Copy to clipboard"
                            >
                              {isCopied(cmd.key) ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 md:mt-8 p-3 md:p-4 bg-blue-50/50 rounded-xl md:rounded-2xl border border-blue-100 flex items-start gap-2 md:gap-3">
                        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] md:text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                            Replace <span className="text-blue-900 font-mono">RECORD_ID</span> with an actual record ID from your submissions. You can import cURL commands directly into <span className="text-blue-900">Postman</span> via File → Import.
                        </p>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    {/* Request Payload Section */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">Body Format (JSON)</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-gray-50 p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-gray-50 text-[10px] md:text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleRequest, null, 2)}
                            </pre>
                            <div className="absolute top-2 md:top-4 right-2 md:right-4 p-1.5 md:p-2 bg-white/50 rounded-lg backdrop-blur-sm border border-white/50 text-[8px] md:text-[9px] font-black uppercase text-gray-400">application/json</div>
                        </div>

                        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50/50 rounded-xl md:rounded-2xl border border-blue-100 flex items-start gap-2 md:gap-3">
                            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                                Use <span className="text-blue-900">multipart/form-data</span> for requests containing binary files.
                            </p>
                        </div>
                    </motion.section>

                    {/* Response Section */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl shrink-0">
                              <Box size={16} className="md:hidden" />
                              <Box size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">Success Response</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-gray-50 p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-gray-50 text-[10px] md:text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleResponse, null, 2)}
                            </pre>
                             <div className="absolute top-2 md:top-4 right-2 md:right-4 p-1.5 md:p-2 bg-white/50 rounded-lg backdrop-blur-sm border border-white/50 text-[8px] md:text-[9px] font-black uppercase text-gray-400">200 OK</div>
                        </div>
                    </motion.section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-cyan-50 text-cyan-600 rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">List Records Response</h2>
                        </div>
                        <pre className="bg-gray-50 p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-gray-50 text-[10px] md:text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                        {JSON.stringify(sampleListResponse, null, 2)}
                        </pre>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-red-50 text-red-600 rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">Delete Record Response</h2>
                        </div>
                        <pre className="bg-gray-50 p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-gray-50 text-[10px] md:text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed shadow-inner">
                        {JSON.stringify(sampleDeleteResponse, null, 2)}
                        </pre>
                        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-red-50/50 rounded-xl md:rounded-2xl border border-red-100 flex items-start gap-2 md:gap-3">
                            <Info size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] text-red-700 font-bold uppercase tracking-tight leading-relaxed">
                                This action is <span className="text-red-900">irreversible</span>. The record will be permanently removed from the database.
                            </p>
                        </div>
                    </motion.section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl shrink-0">
                              <Info size={16} className="md:hidden" />
                              <Info size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-gray-800 font-display">CRUD Flow</h2>
                        </div>
                        <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-gray-700">
                          <p><span className="font-black">1.</span> Submit data with <span className="font-mono text-[10px] md:text-xs">POST /api/{form.slug}</span></p>
                          <p><span className="font-black">2.</span> Fetch records with <span className="font-mono text-[10px] md:text-xs">GET /api/{form.slug}/data</span></p>
                          <p><span className="font-black">3.</span> Get one record with <span className="font-mono text-[10px] md:text-xs">GET /api/{form.slug}/data/:recordId</span></p>
                          <p><span className="font-black">4.</span> Update using <span className="font-mono text-[10px] md:text-xs">PUT /api/{form.slug}/data/:recordId</span></p>
                          <p><span className="font-black">5.</span> Delete using <span className="font-mono text-[10px] md:text-xs text-red-600">DELETE /api/{form.slug}/data/:recordId</span></p>
                        </div>
                    </motion.section>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

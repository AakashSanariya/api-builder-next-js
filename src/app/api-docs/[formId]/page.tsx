"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formService } from "../../../services/form.service";
import { relationshipService } from "../../../services/relationship.service";
import { FormModel } from "../../../types/form.types";
import { Relationship, RelationshipType } from "../../../types/relationship.types";
import { Loader2, ArrowLeft, Copy, Check, Terminal, Globe, Code, Box, Info, Lock, Braces, FileJson, BookOpen, GitBranch, ArrowRight, Download } from "lucide-react";
import Button from "../../../components/common/Button";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { downloadOpenApiSpec } from "../../../utils/openapi";

const TYPE_BADGES: Record<RelationshipType, { label: string; color: string }> = {
  "one-to-one": { label: "1:1", color: "text-blue-600 bg-blue-50 border-blue-100" },
  "one-to-many": { label: "1:N", color: "text-amber-600 bg-amber-50 border-amber-100" },
  "many-to-many": { label: "N:M", color: "text-purple-600 bg-purple-50 border-purple-100" },
};

function ApiDocsPageContent() {
  const { formId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<FormModel | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [apiType, setApiType] = useState<"rest" | "graphql">("rest");
  const [gqlResults, setGqlResults] = useState<Record<string, { loading: boolean; data?: any; error?: string }>>({});
  const [gqlVariables, setGqlVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const [formRes, relsRes] = await Promise.all([
          formService.getFormById(formId as string),
          relationshipService.getByFormId(formId as string).catch(() => ({ success: false, data: [] })),
        ]);
        if (formRes.success && formRes.data) {
          setForm(formRes.data);
        }
        const rels = (relsRes as any)?.data;
        if (rels) setRelationships(rels);
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

  const runGraphQL = async (key: string, query: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setGqlResults(prev => ({ ...prev, [key]: { loading: false, error: "Not authenticated. Please log in." } }));
      return;
    }

    setGqlResults(prev => ({ ...prev, [key]: { loading: true } }));

    try {
      const res = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setGqlResults(prev => ({
        ...prev,
        [key]: {
          loading: false,
          data,
          error: data.errors ? data.errors.map((e: any) => e.message).join(", ") : undefined,
        },
      }));
    } catch (err: any) {
      setGqlResults(prev => ({
        ...prev,
        [key]: { loading: false, error: err.message || "Request failed" },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-card">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!form) return null;

  const baseUrl = "http://localhost:5000";
  const graphqlEndpoint = `${baseUrl}/graphql`;
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

  const sampleResponseData = {
    ...sampleRequest,
    ...(relationships.length > 0
      ? Object.fromEntries(
          relationships.map(rel => {
            const label = rel.targetLabel || rel.sourceLabel || "related";
            const relKey = `section_${slugify(label)}_rel`;
            const isMany = rel.type !== "one-to-one";
            return [relKey, isMany ? [{ _id: "related_id_1", data: { field: "value" } }] : { _id: "related_id_1", data: { field: "value" } }];
          })
        )
      : {}),
  };

  const sampleResponse = {
    success: true,
    message: `Successfully processed submission for '${form.name}'`,
    data: sampleResponseData,
    timestamp: new Date().toISOString()
  };

  const sampleListResponse = {
    success: true,
    data: [
      {
        _id: "record_id_1",
        formSlug: form.slug,
        formId: form._id,
        data: sampleResponseData,
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

  const hasFileFields = (form.sections || []).length > 0
    ? form.sections!.some(s => s.fields.some(f => f.type === 'file'))
    : (form.fields || []).some(f => f.type === 'file');

  const NL = '\n';
  const CONT = ' \\';

  const authToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const AUTH_HEADER = authToken ? `-H "Authorization: Bearer ${authToken}"` : "-H \"Authorization: Bearer YOUR_AUTH_TOKEN\"";
  const JSON_AUTH_HEADER = authToken ? `"Authorization": "Bearer ${authToken}"` : `"Authorization": "Bearer YOUR_AUTH_TOKEN"`;

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
    ? ['curl -X POST ' + createEndpoint, '  ' + AUTH_HEADER, buildFormFlags()].join(CONT + NL)
    : ['curl -X POST ' + createEndpoint, '  ' + AUTH_HEADER, '  -H "Content-Type: application/json"', "  -d '" + jsonBody + "'"].join(CONT + NL);

  const curlGetList = ['curl -X GET "' + listEndpoint + '"', '  ' + AUTH_HEADER].join(CONT + NL);

  const curlGetById = ['curl -X GET ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', '  ' + AUTH_HEADER].join(CONT + NL);

  const curlPut = hasFileFields
    ? ['curl -X PUT ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', '  ' + AUTH_HEADER, buildFormFlags()].join(CONT + NL)
    : ['curl -X PUT ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', '  ' + AUTH_HEADER, '  -H "Content-Type: application/json"', "  -d '" + jsonBody + "'"].join(CONT + NL);

  const curlDelete = ['curl -X DELETE ' + baseUrl + '/api/' + form.slug + '/data/RECORD_ID', '  ' + AUTH_HEADER].join(CONT + NL);

  const curlCommands = [
    { label: 'Create Submission', method: 'POST', methodClass: 'text-primary bg-primary/10 border-primary/20', curl: curlPost, key: 'curl-post' },
    { label: 'List All Records', method: 'GET', methodClass: 'text-emerald-500 bg-emerald-50 border-emerald-100', curl: curlGetList, key: 'curl-get-list' },
    { label: 'Get Single Record', method: 'GET', methodClass: 'text-cyan-500 bg-cyan-50 border-cyan-100', curl: curlGetById, key: 'curl-get-id' },
    { label: 'Update Record', method: 'PUT', methodClass: 'text-amber-500 bg-amber-50 border-amber-100', curl: curlPut, key: 'curl-put' },
    { label: 'Delete Record', method: 'DELETE', methodClass: 'text-red-500 bg-red-50 border-red-100', curl: curlDelete, key: 'curl-delete' },
  ];

  const flatData = flattenSampleForCurl(sampleRequest);
  const sampleJsonData = Object.keys(flatData).length > 0 ? flatData : { field_name: "Sample value" };

  const graphqlQueries = [
    {
      label: 'Create Submission',
      op: 'mutation',
      graphql: `mutation CreateSubmission {\n  createSubmission(slug: "${form.slug}", data: ${JSON.stringify(sampleJsonData, null, 4)}) {\n    success\n    message\n    data {\n      _id\n      data\n    }\n    timestamp\n  }\n}`,
      key: 'gql-create',
      methodClass: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      label: 'List All Records',
      op: 'query',
      graphql: `query ListSubmissions {\n  submissions(slug: "${form.slug}", page: 1, limit: 20) {\n    records {\n      _id\n      data\n      createdAt\n    }\n    pagination {\n      page\n      limit\n      total\n      pages\n    }\n  }\n}`,
      key: 'gql-list',
      methodClass: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Get Single Record',
      op: 'query',
      graphql: `query GetSubmission {\n  submission(slug: "${form.slug}", recordId: "RECORD_ID") {\n    _id\n    data\n    createdAt\n    updatedAt\n  }\n}`,
      key: 'gql-get',
      methodClass: 'text-cyan-500 bg-cyan-50 border-cyan-100',
    },
    {
      label: 'Update Record',
      op: 'mutation',
      graphql: `mutation UpdateSubmission {\n  updateSubmission(slug: "${form.slug}", recordId: "RECORD_ID", data: ${JSON.stringify(sampleJsonData, null, 4)}) {\n    success\n    message\n    data {\n      _id\n      data\n    }\n    timestamp\n  }\n}`,
      key: 'gql-update',
      methodClass: 'text-amber-500 bg-amber-50 border-amber-100',
    },
    {
      label: 'Delete Record',
      op: 'mutation',
      graphql: `mutation DeleteSubmission {\n  deleteSubmission(slug: "${form.slug}", recordId: "RECORD_ID") {\n    success\n    message\n  }\n}`,
      key: 'gql-delete',
      methodClass: 'text-red-500 bg-red-50 border-red-100',
    },
  ];

  const authTokenJson = authToken ? authToken : "YOUR_AUTH_TOKEN";

  const fetchExample = (query: string) => `fetch("${graphqlEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${authTokenJson}"
  },
  body: JSON.stringify({
    query: \`${query.replace(/"/g, '\\"')}\`
  })
})`;

  const codeExamples = [
    {
      label: 'List Forms',
      code: `query {
  forms {
    _id
    name
    slug
    published
  }
}`,
      key: 'code-forms',
    },
    {
      label: 'Form Management (Create)',
      code: `mutation {
  createForm(name: "New Form") {
    _id
    name
    slug
  }
}`,
      key: 'code-create-form',
    },
    {
      label: 'Current User',
      code: `query {
  me {
    firstName
    lastName
    email
  }
}`,
      key: 'code-me',
    },
  ];

  const TabButton = ({ type, label, icon }: { type: "rest" | "graphql"; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setApiType(type)}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
        apiType === type
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
          : "bg-card text-muted-foreground hover:text-foreground border border-border hover:border-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const CodeBlock = ({ code, label, blockKey: blockKey }: { code: string; label?: string; blockKey: string }) => (
    <div className="group">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-foreground truncate">{label}</span>
        </div>
      )}
      <div className="relative">
        <pre className="bg-gray-950 text-muted-foreground/50 p-4 md:p-6 pr-12 md:pr-16 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-xl">{code}</pre>
        <button
          onClick={() => copyToClipboard(code, blockKey)}
          className="absolute top-3 md:top-4 right-3 md:right-4 p-2 md:p-3 bg-white/5 hover:bg-white/15 rounded-lg md:rounded-xl transition-all text-muted-foreground hover:text-white border border-white/10"
          title="Copy to clipboard"
        >
          {isCopied(blockKey) ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 md:py-16 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="outline" size="sm" onClick={() => router.push("/forms")} className="mb-8 md:mb-12 border-border bg-card/50 backdrop-blur-sm shadow-sm text-xs md:text-sm">
            <ArrowLeft size={14} className="mr-2" />
            <span className="hidden sm:inline">Control Center</span>
            <span className="sm:hidden">Back</span>
            </Button>
        </motion.div>

        <header className="mb-6 md:mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
             <div className="w-10 h-10 md:w-14 md:h-14 bg-primary rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
                <Terminal size={20} className="md:hidden" />
                <Terminal size={28} className="hidden md:block" />
             </div>
             <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight font-display truncate">Developer Portal</h1>
                <p className="text-muted-foreground font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] mt-0.5 md:mt-1 truncate">Integration interface for {form.name}</p>
             </div>
          </motion.div>

          {/* API Type Toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-wrap">
            <TabButton type="rest" label="REST API" icon={<Globe size={14} />} />
            <TabButton type="graphql" label="GraphQL" icon={<Braces size={14} />} />
            <span className="w-px h-8 bg-border self-center mx-1 hidden sm:block" />
            <button
              onClick={() => form && downloadOpenApiSpec(form, relationships)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-600 shadow-sm hover:shadow-lg hover:shadow-emerald-100"
              title="Download OpenAPI 3.0 specification"
            >
              <Download size={14} />
              <span className="hidden sm:inline">OpenAPI Spec</span>
            </button>
          </motion.div>
        </header>

        {apiType === "rest" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
            <div className="lg:col-span-12 space-y-6 md:space-y-12">
                
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                       <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl shrink-0">
                          <Globe size={16} className="md:hidden" />
                          <Globe size={20} className="hidden md:block" />
                       </div>
                       <h2 className="text-lg md:text-xl font-black text-foreground font-display">Available REST Endpoints</h2>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      {[
                        { method: 'POST', classes: 'text-primary/70 bg-primary/10', endpoint: createEndpoint, key: 'ep-post' },
                        { method: 'GET', classes: 'text-emerald-400 bg-emerald-400/10', endpoint: listEndpoint, key: 'ep-get-list' },
                        { method: 'GET', classes: 'text-cyan-400 bg-cyan-400/10', endpoint: byIdEndpoint, key: 'ep-get-id' },
                        { method: 'PUT', classes: 'text-amber-400 bg-amber-400/10', endpoint: byIdEndpoint, key: 'ep-put' },
                        { method: 'DELETE', classes: 'text-red-400 bg-red-400/10', endpoint: deleteEndpoint, key: 'ep-delete' },
                      ].map(ep => (
                        <div key={ep.key} className="relative group">
                            <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl group-hover:shadow-primary/20 transition-shadow">
                                <span className={`font-black px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0 ${ep.classes}`}>{ep.method}</span>
                                <span className="flex-1 truncate tracking-tight text-muted-foreground/50 min-w-0">{ep.endpoint}</span>
                                <button
                                    onClick={() => copyToClipboard(ep.endpoint, ep.key)}
                                    className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-muted-foreground hover:text-white shrink-0"
                                >
                                    {isCopied(ep.key) ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                                </button>
                            </div>
                        </div>
                      ))}
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

                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                       <div className="p-2 md:p-3 bg-gray-900 text-white rounded-xl md:rounded-2xl shrink-0">
                          <Terminal size={16} className="md:hidden" />
                          <Terminal size={20} className="hidden md:block" />
                       </div>
                       <div className="min-w-0">
                          <h2 className="text-lg md:text-xl font-black text-foreground font-display">cURL Commands</h2>
                          <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">Ready to paste into terminal or import into Postman</p>
                       </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {curlCommands.map((cmd) => (
                        <div key={cmd.key} className="group">
                          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <span className={`font-black text-[8px] md:text-[10px] uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border ${cmd.methodClass}`}>{cmd.method}</span>
                            <span className="text-xs md:text-sm font-bold text-foreground truncate">{cmd.label}</span>
                          </div>
                          <div className="relative">
                            <pre className="bg-gray-950 text-muted-foreground/50 p-4 md:p-6 pr-12 md:pr-16 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-xl">{cmd.curl}</pre>
                            <button
                              onClick={() => copyToClipboard(cmd.curl, cmd.key)}
                              className="absolute top-3 md:top-4 right-3 md:right-4 p-2 md:p-3 bg-white/5 hover:bg-white/15 rounded-lg md:rounded-xl transition-all text-muted-foreground hover:text-white border border-white/10"
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
                            Replace <span className="text-blue-900 font-mono">RECORD_ID</span> with an actual record ID from your submissions.
                        </p>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-foreground font-display">Body Format (JSON)</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-muted p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-border text-[10px] md:text-xs text-foreground overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleRequest, null, 2)}
                            </pre>
                            <div className="absolute top-2 md:top-4 right-2 md:right-4 p-1.5 md:p-2 bg-card/50 rounded-lg backdrop-blur-sm border border-border text-[8px] md:text-[9px] font-black uppercase text-muted-foreground">application/json</div>
                        </div>

                        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50/50 rounded-xl md:rounded-2xl border border-blue-100 flex items-start gap-2 md:gap-3">
                            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                                Use <span className="text-blue-900">multipart/form-data</span> for requests containing binary files.
                            </p>
                        </div>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl shrink-0">
                              <Box size={16} className="md:hidden" />
                              <Box size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-foreground font-display">Success Response</h2>
                        </div>
                        
                        <div className="relative">
                            <pre className="bg-muted p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-border text-[10px] md:text-xs text-foreground overflow-x-auto font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(sampleResponse, null, 2)}
                            </pre>
                             <div className="absolute top-2 md:top-4 right-2 md:right-4 p-1.5 md:p-2 bg-card/50 rounded-lg backdrop-blur-sm border border-border text-[8px] md:text-[9px] font-black uppercase text-muted-foreground">200 OK</div>
                        </div>
                    </motion.section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-cyan-50 text-cyan-600 rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-foreground font-display">List Records Response</h2>
                        </div>
                        <pre className="bg-muted p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-border text-[10px] md:text-xs text-foreground overflow-x-auto font-mono leading-relaxed shadow-inner">
                        {JSON.stringify(sampleListResponse, null, 2)}
                        </pre>
                    </motion.section>

                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-red-50 text-red-600 rounded-xl md:rounded-2xl shrink-0">
                              <Code size={16} className="md:hidden" />
                              <Code size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-foreground font-display">Delete Record Response</h2>
                        </div>
                        <pre className="bg-muted p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-border text-[10px] md:text-xs text-foreground overflow-x-auto font-mono leading-relaxed shadow-inner">
                        {JSON.stringify(sampleDeleteResponse, null, 2)}
                        </pre>
                        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-red-50/50 rounded-xl md:rounded-2xl border border-red-100 flex items-start gap-2 md:gap-3">
                            <Info size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] md:text-[10px] text-red-700 font-bold uppercase tracking-tight leading-relaxed">
                                This action is <span className="text-red-900">irreversible</span>.
                            </p>
                        </div>
                    </motion.section>
                </div>

                {relationships.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                  >
                      <div className="flex items-center gap-3 mb-6 md:mb-8">
                         <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl shrink-0">
                            <GitBranch size={16} className="md:hidden" />
                            <GitBranch size={20} className="hidden md:block" />
                         </div>
                         <div className="min-w-0">
                            <h2 className="text-lg md:text-xl font-black text-foreground font-display">Table Relationships</h2>
                            <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">Related data tables connected to this schema</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                        {relationships.map(rel => {
                          const isSource = rel.sourceFormId === formId;
                          const badge = TYPE_BADGES[rel.type];
                          return (
                            <div key={rel._id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-muted rounded-xl md:rounded-2xl border border-border">
                              <span className="text-xs md:text-sm font-black text-foreground">{isSource ? rel.sourceLabel : rel.targetLabel}</span>
                              <span className={`font-black text-[9px] md:text-[10px] px-2 py-1 rounded-lg border ${badge.color}`}>{badge.label}</span>
                              <ArrowRight size={14} className="text-muted-foreground/50" />
                              <span className="text-xs md:text-sm font-black text-foreground">{isSource ? rel.targetLabel : rel.sourceLabel}</span>
                              {rel.eagerLoad && (
                                <span className="ml-auto text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-wider px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">Auto-loaded</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                  </motion.section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                           <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl shrink-0">
                              <Info size={16} className="md:hidden" />
                              <Info size={20} className="hidden md:block" />
                           </div>
                           <h2 className="text-lg md:text-xl font-black text-foreground font-display">CRUD Flow</h2>
                        </div>
                        <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-foreground">
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
            <div className="lg:col-span-12 space-y-6 md:space-y-12">

              {/* GraphQL Endpoint */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                     <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl shrink-0">
                        <Braces size={16} className="md:hidden" />
                        <Braces size={20} className="hidden md:block" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-black text-foreground font-display">GraphQL Endpoint</h2>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">Single endpoint for all operations</p>
                     </div>
                  </div>

                  <div className="relative group">
                      <div className="flex items-center gap-2 md:gap-4 bg-gray-950 text-white p-4 md:p-6 rounded-xl md:rounded-[2rem] font-mono text-xs md:text-sm overflow-hidden shadow-2xl">
                          <span className="text-purple-400 font-black px-2 md:px-3 py-0.5 md:py-1 bg-purple-400/10 rounded-md md:rounded-lg text-[9px] md:text-xs shrink-0">POST</span>
                          <span className="flex-1 truncate tracking-tight text-muted-foreground/50 min-w-0">{graphqlEndpoint}</span>
                          <button
                              onClick={() => copyToClipboard(graphqlEndpoint, 'gql-ep')}
                              className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-muted-foreground hover:text-white shrink-0"
                          >
                              {isCopied('gql-ep') ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="" />}
                          </button>
                      </div>
                  </div>

                  <p className="mt-4 md:mt-6 text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                    Open <span className="font-mono text-purple-600">{graphqlEndpoint}</span> in your browser for the interactive Apollo Sandbox playground.
                  </p>

                  {/* Sandbox Headers Section */}
                  <div className="mt-4 md:mt-6 p-4 md:p-5 bg-purple-50/50 rounded-xl md:rounded-[1.5rem] border border-purple-100">
                    <div className="flex items-start gap-3 mb-3">
                      <Info size={14} className="text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] md:text-[10px] text-purple-800 font-black uppercase tracking-wider leading-relaxed mb-2">
                          Apollo Sandbox — Set HTTP Headers
                        </p>
                        <ol className="text-[9px] md:text-[10px] text-purple-700 font-bold tracking-wide leading-relaxed space-y-1 ml-2">
                          <li>1. Open <span className="font-mono text-purple-900">{graphqlEndpoint}</span> in your browser</li>
                          <li>2. Click the <span className="font-mono text-purple-900">Headers</span> tab (bottom-left panel)</li>
                          <li>3. Paste the header JSON below</li>
                        </ol>
                      </div>
                    </div>
                    <div className="relative">
                      <pre className="bg-card p-3 rounded-xl border border-purple-200 text-[10px] text-purple-900 font-mono leading-relaxed">
{`{
  "Authorization": "Bearer ${authTokenJson}"
}`}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(`{\n  "Authorization": "Bearer ${authTokenJson}"\n}`, 'gql-headers')}
                        className="absolute top-2 right-2 p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all text-purple-600"
                        title="Copy headers"
                      >
                        {isCopied('gql-headers') ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-6 p-2 md:p-3 bg-muted rounded-xl border border-border flex items-center justify-between">
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wide">cURL</span>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST ${graphqlEndpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer ${authTokenJson}" \\\n  -d '{ "query": "{ forms { name slug } }" }'`, 'gql-curl')}
                      className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-wider hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {isCopied('gql-curl') ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy cURL</>}
                    </button>
                  </div>

                  {!form.published && (
                  <div className="mt-4 md:mt-6 p-4 md:p-5 bg-amber-50 rounded-xl md:rounded-[1.5rem] border border-amber-100 flex items-start gap-3">
                      <Lock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] md:text-[11px] text-amber-800 font-black uppercase tracking-wider leading-relaxed italic">
                          Status: <span className="text-amber-600">Restricted</span>. Publish the form in the builder to enable mutations on this schema.
                      </p>
                  </div>
                  )}
              </motion.section>

              {/* Form Management Queries */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                     <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl shrink-0">
                        <BookOpen size={16} className="md:hidden" />
                        <BookOpen size={20} className="hidden md:block" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-black text-foreground font-display">Utility Queries</h2>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">Auth & Form management</p>
                     </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {codeExamples.map((ex) => {
                      const result = gqlResults[ex.key];
                      return (
                      <div key={ex.key} className="group">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <span className="text-xs md:text-sm font-bold text-foreground truncate">{ex.label}</span>
                        </div>
                        <div className="relative">
                          <pre className="bg-gray-950 text-muted-foreground/50 p-4 md:p-6 pr-16 md:pr-20 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-xl">{ex.code}</pre>
                          <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2">
                            <button
                              onClick={() => runGraphQL(ex.key, ex.code)}
                              disabled={result?.loading}
                              className="p-2 md:p-3 bg-primary/80 hover:bg-primary rounded-lg md:rounded-xl transition-all text-white border border-primary/30 disabled:opacity-50"
                              title="Run query"
                            >
                              {result?.loading ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(ex.code, ex.key)}
                              className="p-2 md:p-3 bg-white/5 hover:bg-white/15 rounded-lg md:rounded-xl transition-all text-muted-foreground hover:text-white border border-white/10"
                              title="Copy to clipboard"
                            >
                              {isCopied(ex.key) ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="" />}
                            </button>
                          </div>
                        </div>
                        {result?.loading && (
                          <div className="mt-2 p-3 bg-muted rounded-xl border border-border flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Executing...</span>
                          </div>
                        )}
                        {result?.error && (
                          <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100">
                            <pre className="text-[10px] text-red-700 font-mono whitespace-pre-wrap">{result.error}</pre>
                          </div>
                        )}
                        {result?.data && !result.error && (
                          <div className="mt-2">
                            <pre className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
              </motion.section>

              {/* Dynamic Submission Operations */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                     <div className="p-2 md:p-3 bg-gray-900 text-white rounded-xl md:rounded-2xl shrink-0">
                        <Terminal size={16} className="md:hidden" />
                        <Terminal size={20} className="hidden md:block" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-black text-foreground font-display">Submission Operations</h2>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">CRUD for {form.name} records</p>
                     </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {graphqlQueries.map((q) => {
                      const result = gqlResults[q.key];
                      return (
                      <div key={q.key} className="group">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <span className={`font-black text-[8px] md:text-[10px] uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border ${q.methodClass}`}>{q.op}</span>
                          <span className="text-xs md:text-sm font-bold text-foreground truncate">{q.label}</span>
                        </div>
                        <div className="relative">
                          <pre className="bg-gray-950 text-muted-foreground/50 p-4 md:p-6 pr-12 md:pr-16 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all shadow-xl">{q.graphql}</pre>
                          <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2">
                            <button
                              onClick={() => {
                                const substituted = q.graphql.replace(/RECORD_ID/g, gqlVariables[q.key] || "RECORD_ID");
                                runGraphQL(q.key, substituted);
                              }}
                              disabled={result?.loading}
                              className="p-2 md:p-3 bg-primary/80 hover:bg-primary rounded-lg md:rounded-xl transition-all text-white border border-primary/30 disabled:opacity-50"
                              title="Run query"
                            >
                              {result?.loading ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(q.graphql, q.key)}
                              className="p-2 md:p-3 bg-white/5 hover:bg-white/15 rounded-lg md:rounded-xl transition-all text-muted-foreground hover:text-white border border-white/10"
                              title="Copy to clipboard"
                            >
                              {isCopied(q.key) ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="" />}
                            </button>
                          </div>
                        </div>
                        {result?.loading && (
                          <div className="mt-2 p-3 bg-muted rounded-xl border border-border flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Executing...</span>
                          </div>
                        )}
                        {result?.error && (
                          <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100">
                            <pre className="text-[10px] text-red-700 font-mono whitespace-pre-wrap">{result.error}</pre>
                          </div>
                        )}
                        {result?.data && !result.error && (
                          <div className="mt-2">
                            <pre className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
              </motion.section>

              {relationships.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.125 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                       <div className="p-2 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl shrink-0">
                          <GitBranch size={16} className="md:hidden" />
                          <GitBranch size={20} className="hidden md:block" />
                       </div>
                       <div className="min-w-0">
                          <h2 className="text-lg md:text-xl font-black text-foreground font-display">Relationships</h2>
                           <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">Related data is automatically included in all responses</p>
                       </div>
                    </div>
                    <div className="space-y-3">
                      {relationships.map(rel => {
                        const isSource = rel.sourceFormId === formId;
                        const badge = TYPE_BADGES[rel.type];
                        return (
                          <div key={rel._id} className="flex items-center gap-3 p-3 md:p-4 bg-muted rounded-xl border border-border">
                            <span className="text-xs font-black text-foreground">{isSource ? rel.sourceLabel : rel.targetLabel}</span>
                            <span className={`font-black text-[9px] px-2 py-1 rounded-lg border ${badge.color}`}>{badge.label}</span>
                            <ArrowRight size={14} className="text-muted-foreground/50" />
                            <span className="text-xs font-black text-foreground">{isSource ? rel.targetLabel : rel.sourceLabel}</span>
                            {rel.eagerLoad && (
                              <span className="ml-auto text-[8px] font-black text-emerald-600 uppercase tracking-wider px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">Auto-loaded</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <p className="text-[9px] text-blue-700 font-bold">
                        Related data is always included in list and detail responses automatically.
                      </p>
                    </div>
                </motion.section>
              )}

              {/* GraphQL Fetch Example */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                     <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl shrink-0">
                        <FileJson size={16} className="md:hidden" />
                        <FileJson size={20} className="hidden md:block" />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-black text-foreground font-display">Client Example (fetch)</h2>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 md:mt-1">JavaScript / TypeScript snippet</p>
                     </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {graphqlQueries.slice(0, 2).map((q) => (
                      <CodeBlock key={`fetch-${q.key}`} code={`const query = \`\n${q.graphql}\n\`;\n\nconst response = await fetch("${graphqlEndpoint}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer ${authTokenJson}"\n  },\n  body: JSON.stringify({ query })\n});\n\nconst result = await response.json();\nconsole.log(result);`} label={q.label} blockKey={`fetch-${q.key}`} />
                    ))}
                  </div>

                  <div className="mt-6 md:mt-8 p-3 md:p-4 bg-blue-50/50 rounded-xl md:rounded-2xl border border-blue-100 flex items-start gap-2 md:gap-3">
                      <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] md:text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                          For file uploads, use <span className="text-blue-900 font-mono">multipart/form-data</span> with the GraphQL multipart request spec, or upload files via REST first and pass URLs in the <span className="text-blue-900 font-mono">data</span> argument.
                      </p>
                  </div>
              </motion.section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <ProtectedRoute>
      <ApiDocsPageContent />
    </ProtectedRoute>
  );
}

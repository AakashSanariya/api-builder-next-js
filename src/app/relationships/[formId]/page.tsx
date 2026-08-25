"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getSmoothStepPath,
  MarkerType,
  Connection,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface TableNodeData extends Record<string, unknown> {
  label: string;
  slug: string;
  fieldCount: number;
}
import { motion } from "framer-motion";
import { relationshipService } from "../../../services/relationship.service";
import { formService } from "../../../services/form.service";
import { Relationship, RelationshipType } from "../../../types/relationship.types";
import { FormModel } from "../../../types/form.types";
import { usePopup } from "../../../contexts/PopupContext";
import CreateRelationshipModal from "../../../components/relationships/CreateRelationshipModal";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Box,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import Button from "../../../components/common/Button";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { useThemeColors } from "../../../hooks/useThemeColors";

const TYPE_LABELS: Record<RelationshipType, string> = {
  "one-to-one": "1:1",
  "one-to-many": "1:N",
  "many-to-many": "N:M",
};

const TYPE_COLORS: Record<RelationshipType, string> = {
  "one-to-one": "#6366f1",
  "one-to-many": "#f59e0b",
  "many-to-many": "#8b5cf6",
};

function TableNode({ data }: NodeProps<Node<TableNodeData, string>>) {
  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow-lg min-w-[180px] hover:shadow-xl transition-shadow">
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3 !border-2 !border-white" />
      <div className="px-5 py-4 border-b border-border from-primary/10 to-transparent rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shrink-0">
            <Box size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-foreground text-sm truncate leading-tight">{data.label}</p>
            <p className="text-[9px] text-muted-foreground font-bold truncate">{data.slug}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
        <span className="text-[10px] font-bold text-muted-foreground">{data.fieldCount} fields</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
}

interface EdgeData extends Record<string, unknown> {
  type: RelationshipType;
  eagerLoad: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function RelationshipEdge({
  id,
  source,
  target,
  data,
  selected,
  ...props
}: EdgeProps<Edge<EdgeData, string>>) {
  const colors = useThemeColors();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });

  if (!data) return null;

  const typeColor = data.type === "one-to-one" ? colors.primary : TYPE_COLORS[data.type];

  return (
    <>
      <path
        id={id}
        style={{
          stroke: selected ? typeColor : colors.border,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data.eagerLoad ? "none" : "8 4",
        }}
        className="transition-all"
        d={edgePath}
        markerEnd={`url(#arrow-${data.type})`}
      />
      <foreignObject
        width={140}
        height={50}
        x={labelX - 70}
        y={labelY - 25}
        className="overflow-visible"
      >
        <div className="flex items-center gap-1 justify-center">
          <span
                  className={`text-[9px] font-black px-2 py-1 rounded-lg border-2 shadow-sm cursor-pointer select-none`}
                    style={{
                      color: typeColor,
                      borderColor: typeColor,
                      backgroundColor: `${typeColor}10`,
                    }}
                  >
                    {TYPE_LABELS[data.type]}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggle(id);
            }}
            className={`p-1 rounded-md transition-all ${
              data.eagerLoad ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground bg-muted"
            }`}
            title="Toggle eager load"
          >
            {data.eagerLoad ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            title="Delete relationship"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </foreignObject>
    </>
  );
}

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

function ErDiagramContent() {
  const { formId } = useParams();
  const router = useRouter();
  const { showPopup } = usePopup();
  const colors = useThemeColors();
  const typeColors = useMemo(() => ({
    ...TYPE_COLORS,
    "one-to-one": colors.primary,
  }), [colors.primary]);
  const [form, setForm] = useState<FormModel | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allForms, setAllForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchData = async () => {
    try {
      const [formRes, relRes, formsRes] = await Promise.all([
        formService.getFormById(formId as string),
        relationshipService.getByFormId(formId as string),
        formService.getAllForms(),
      ]);

      if (formRes.success && formRes.data) setForm(formRes.data);
      if (relRes.success && relRes.data) setRelationships(relRes.data);
      if (formsRes.success && formsRes.data) setAllForms(formsRes.data);
    } catch (err) {
      console.error(err);
      router.push("/relationships");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEagerLoad = useCallback(async (edgeId: string) => {
    const rel = relationships.find(r => r._id === edgeId);
    if (!rel) return;

    try {
      const res = await relationshipService.update(rel._id, { eagerLoad: !rel.eagerLoad });
      if (res.success && res.data) {
        setRelationships(prev =>
          prev.map(r => r._id === rel._id ? { ...r, eagerLoad: !r.eagerLoad } : r)
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, [relationships]);

  const handleDeleteRelationship = useCallback(async (edgeId: string) => {
    const rel = relationships.find(r => r._id === edgeId);
    if (!rel) return;

    const confirmed = await showPopup({
      type: "confirm",
      title: "Delete Relationship",
      message: `Remove this ${rel.type} relationship?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await relationshipService.delete(rel._id);
      if (res.success) {
        setRelationships(prev => prev.filter(r => r._id !== rel._id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [relationships, showPopup]);

  const handleAddRelationship = () => {
    setShowCreateModal(true);
  };

  const involvedFormIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add(formId as string);
    relationships.forEach(r => {
      ids.add(r.sourceFormId);
      ids.add(r.targetFormId);
    });
    return ids;
  }, [formId, relationships]);

  useEffect(() => {
    if (!form || relationships.length === 0 && involvedFormIds.size === 1) {
      const centerX = 400;
      const centerY = 300;
      const newNodes: Node[] = [{
        id: formId as string,
        type: "tableNode",
        position: { x: centerX - 90, y: centerY - 40 },
        data: {
          label: form?.name || "Loading...",
          slug: form?.slug || "",
          fieldCount: form?.sections?.flatMap(s => s.fields).length || form?.fields?.length || 0,
        },
      }];
      setNodes(newNodes);
      setEdges([]);
      return;
    }

    const formsMap = new Map<string, FormModel>();
    [...allForms, form].filter(Boolean).forEach(f => {
      if (f?._id) formsMap.set(f._id, f);
    });

    const formIds = Array.from(involvedFormIds);
    const positions: Record<string, { x: number; y: number }> = {};
    const cols = Math.ceil(Math.sqrt(formIds.length));
    const spacingX = 280;
    const spacingY = 180;
    const startX = 50;
    const startY = 100;

    formIds.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[id] = { x: startX + col * spacingX, y: startY + row * spacingY };
    });

    const newNodes: Node[] = formIds.map(id => {
      const f = formsMap.get(id);
      const allFlds = f?.sections?.flatMap(s => s.fields) || f?.fields || [];
      return {
        id,
        type: "tableNode",
        position: positions[id],
        data: {
          label: f?.name || "Unknown",
          slug: f?.slug || "",
          fieldCount: allFlds.length,
        },
      };
    });

    const newEdges: Edge[] = relationships.map((rel, idx) => ({
      id: rel._id,
      source: rel.sourceFormId,
      target: rel.targetFormId,
      type: "relationshipEdge",
      data: {
        type: rel.type,
        eagerLoad: rel.eagerLoad,
        onToggle: handleToggleEagerLoad,
        onDelete: handleDeleteRelationship,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: typeColors[rel.type],
        width: 20,
        height: 20,
      },
      style: {
        stroke: typeColors[rel.type],
        strokeWidth: rel.eagerLoad ? 3 : 2,
        strokeDasharray: rel.eagerLoad ? "none" : "8 4",
      },
      animated: rel.eagerLoad,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [form, relationships, allForms, formId, involvedFormIds, handleToggleEagerLoad, handleDeleteRelationship, typeColors]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      handleAddRelationship();
    },
    [handleAddRelationship]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="px-6 py-4 bg-card border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/relationships")}>
            <ArrowLeft size={14} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-black text-foreground font-display">
              {form?.name || "ERD Diagram"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Entity Relationship Diagram
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleAddRelationship} className="rounded-[2rem]">
          <Plus size={14} className="mr-2" />
          Link Table
        </Button>
      </header>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "relationshipEdge",
            markerEnd: { type: MarkerType.ArrowClosed, color: colors.border },
          }}
        >
          <defs>
            {(["one-to-one", "one-to-many", "many-to-many"] as RelationshipType[]).map(type => (
              <marker
                key={type}
                id={`arrow-${type}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={typeColors[type]} />
              </marker>
            ))}
          </defs>
          <Background color={colors.border} gap={20} />
          <Controls className="!rounded-2xl !shadow-lg !border !border-border" />
          <MiniMap
            nodeStrokeColor={colors.primary}
            nodeColor={colors.primaryRgba(0.2)}
            nodeBorderRadius={12}
            className="!rounded-2xl !shadow-lg !border !border-border"
          />
        </ReactFlow>
      </div>

      <CreateRelationshipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        forms={allForms}
        preselectedSourceId={formId as string}
        onCreated={() => { fetchData(); }}
      />
    </div>
  );
}

export default function ErDiagramPage() {
  return (
    <ProtectedRoute>
      <ErDiagramContent />
    </ProtectedRoute>
  );
}

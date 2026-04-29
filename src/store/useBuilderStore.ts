import { create } from "zustand";
import { SectionSchema, FieldSchema, FieldType } from "../types/field.types";

interface BuilderState {
  sections: SectionSchema[];
  selectedField: FieldSchema | null;
  activeSectionId: string | null;
  formName: string;
  formSlug: string;
  isPublished: boolean;

  // Header Actions
  setSections: (sections: SectionSchema[]) => void;
  setFormName: (name: string) => void;
  setFormSlug: (slug: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  reset: () => void;
  setSelectedField: (field: FieldSchema | null) => void;
  setActiveSection: (id: string | null) => void;

  // Section Actions
  addSection: (title?: string) => void;
  updateSection: (sectionId: string, updates: Partial<SectionSchema>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;

  // Field Actions (Section Aware)
  addField: (type: FieldType, sectionId?: string) => void;
  updateField: (id: string, updates: Partial<FieldSchema>) => void;
  deleteField: (id: string) => void;
  reorderFields: (sectionId: string, activeId: string, overId: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  sections: [],
  selectedField: null,
  activeSectionId: null,
  formName: "",
  formSlug: "",
  isPublished: false,

  setSections: (sections) => set({ sections }),

  addSection: (title) => {
    set((state) => ({
      sections: [
        ...state.sections,
        {
          id: `section_${Math.random().toString(36).substr(2, 9)}`,
          title: title || `Module ${String(state.sections.length + 1).padStart(2, '0')}`,
          fields: [],
        }
      ]
    }));
  },

  updateSection: (sectionId, updates) => {
    set((state) => ({
      sections: state.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  },

  deleteSection: (sectionId) => {
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== sectionId),
    }));
  },

  reorderSections: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.sections.findIndex((s) => s.id === activeId);
      const newIndex = state.sections.findIndex((s) => s.id === overId);
      const newSections = [...state.sections];
      const [removed] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, removed);
      return { sections: newSections };
    });
  },

  addField: (type, sectionId) => {
    const id = `${type}-${Date.now()}`;
    const newField: FieldSchema = {
      id,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      name: `${type.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
      validations: { required: false },
    };

    if (type === "radio" || type === "checkbox" || type === "select") {
      newField.options = [
        { label: "Option 1", value: "option1", id: "opt_1" },
        { label: "Option 2", value: "option2", id: "opt_2" },
      ];
    }

    set((state) => {
      let targetSectionId = sectionId || state.activeSectionId;
      
      // If no sectionId provided or active found, use the first section or create one
      if (!targetSectionId && state.sections.length > 0) {
        targetSectionId = state.sections[0].id;
      } else if (state.sections.length === 0) {
        const newSection: SectionSchema = { id: `section_${Date.now()}`, title: "Main Section", fields: [] };
        return {
          sections: [{ ...newSection, fields: [newField] }],
          selectedField: newField,
          activeSectionId: newSection.id
        };
      }

      return {
        sections: state.sections.map((s) =>
          s.id === targetSectionId ? { ...s, fields: [...s.fields, newField] } : s
        ),
        selectedField: newField,
        activeSectionId: targetSectionId // Keep focus on the section where field was added
      };
    });
  },

  updateField: (id, updates) => {
    set((state) => {
      const updatedSections = state.sections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      }));

      const findField = () => {
        for (const s of updatedSections) {
          const f = s.fields.find(field => field.id === id);
          if (f) return f;
        }
        return null;
      }

      return {
        sections: updatedSections,
        selectedField: state.selectedField?.id === id ? findField() : state.selectedField,
      };
    });
  },

  deleteField: (id) => {
    set((state) => ({
      sections: state.sections.map((s) => ({
        ...s,
        fields: s.fields.filter((f) => f.id !== id),
      })),
      selectedField: state.selectedField?.id === id ? null : state.selectedField,
    }));
  },

  reorderFields: (sectionId, activeId, overId) => {
    set((state) => ({
      sections: state.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const oldIndex = s.fields.findIndex((f) => f.id === activeId);
        const newIndex = s.fields.findIndex((f) => f.id === overId);
        const newFields = [...s.fields];
        const [removed] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, removed);
        return { ...s, fields: newFields };
      }),
    }));
  },

  setSelectedField: (field) => set({ selectedField: field }),
  setActiveSection: (id) => set({ activeSectionId: id }),
  setFormName: (name) => set({ formName: name }),
  setFormSlug: (slug) => set({ formSlug: slug }),
  setIsPublished: (published) => set({ isPublished: published }),
  reset: () => set({ sections: [], selectedField: null, activeSectionId: null, formName: "", formSlug: "", isPublished: false }),
}));

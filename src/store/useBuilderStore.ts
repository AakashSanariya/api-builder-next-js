import { create } from "zustand";
import { FieldSchema, FieldType } from "../types/field.types";

interface BuilderState {
  fields: FieldSchema[];
  selectedField: FieldSchema | null;
   formName: string;
   formSlug: string;
   isPublished: boolean;
 
   // Actions
   setFields: (fields: FieldSchema[]) => void;
   setFormSlug: (slug: string) => void;
   addField: (type: FieldType) => void;
  updateField: (id: string, updates: Partial<FieldSchema>) => void;
  deleteField: (id: string) => void;
  reorderFields: (activeId: string, overId: string) => void;
  setSelectedField: (field: FieldSchema | null) => void;
  setFormName: (name: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  fields: [],
  selectedField: null,
  formName: "",
  formSlug: "",
  isPublished: false,

  setFields: (fields) => set({ fields }),

  addField: (type) => {
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

    set((state) => ({
      fields: [...state.fields, newField],
      selectedField: newField,
    }));
  },

  updateField: (id, updates) => {
    set((state) => {
      const updatedFields = state.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      );
      const updatedSelectedField =
        state.selectedField?.id === id
          ? { ...state.selectedField, ...updates }
          : state.selectedField;

      return {
        fields: updatedFields,
        selectedField: updatedSelectedField,
      };
    });
  },

  deleteField: (id) => {
    set((state) => ({
      fields: state.fields.filter((f) => f.id !== id),
      selectedField: state.selectedField?.id === id ? null : state.selectedField,
    }));
  },

  reorderFields: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.fields.findIndex((f) => f.id === activeId);
      const newIndex = state.fields.findIndex((f) => f.id === overId);

      const newFields = [...state.fields];
      const [removed] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, removed);

      return { fields: newFields };
    });
  },

  setSelectedField: (field) => set({ selectedField: field }),
  setFormName: (name) => set({ formName: name }),
  setFormSlug: (formSlug) => set({ formSlug }),
  setIsPublished: (published) => set({ isPublished: published }),
  reset: () => set({ fields: [], selectedField: null, formName: "", formSlug: "", isPublished: false }),
}));

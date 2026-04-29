"use client";

import React from "react";
import { FieldSchema } from "../../types/field.types";
import InputField from "../common/InputField";
import TextArea from "../common/TextArea";
import RadioGroup from "../common/RadioGroup";
import CheckboxGroup from "../common/CheckboxGroup";
import FileUpload from "../common/FileUpload";
import Button from "../common/Button";
import Link from "../common/Link";
import Select from "../common/Select";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  const commonProps = {
    label: field.label,
    name: field.name,
    required: field.validations?.required,
    error,
  };

  switch (field.type) {
    case "input":
      return (
        <InputField
          {...commonProps}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );

    case "textarea":
      return (
        <TextArea
          {...commonProps}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );

    case "radio":
      return (
        <RadioGroup
          {...commonProps}
          options={field.options || []}
          value={value || ""}
          onChange={onChange}
        />
      );

    case "checkbox":
      return (
        <CheckboxGroup
          {...commonProps}
          options={field.options || []}
          value={value || []}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <Select
          {...commonProps}
          multiple={field.multiple}
          options={field.options || []}
          value={value || (field.multiple ? [] : "")}
          onChange={(val) => {
            // The new Select component already parses JSON and handles multiple arrays
            onChange(val);
          }}
        />
      );

    case "file":
      return (
        <FileUpload
          {...commonProps}
          value={value || []}
          multiple={field.multiple}
          onChange={onChange}
        />
      );

    case "button":
      const isButtonObj = value !== null && typeof value === 'object';
      return (
        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Configure Button Action</label>
          <div className="space-y-4">
            <InputField
              label="Button Display Text"
              value={isButtonObj ? value.label : (value || field?.label)}
              onChange={(e) => {
                const newValue = isButtonObj ? { ...value, label: e.target.value } : { label: e.target.value, value: field.value || "clicked" };
                onChange(newValue);
              }}
              placeholder="Enter text for the button..."
            />
            <div className="flex items-center gap-4 pt-2">
              <Button type="button" className="w-fit">
                {isButtonObj ? value.label : (value || field.label || "Action")}
              </Button>
              <div className="text-[9px] font-bold text-slate-400 uppercase italic">Live Preview</div>
            </div>
          </div>
        </div>
      );

    case "link":
      const isLinkObj = value !== null && typeof value === 'object';
      return (
        <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-50 space-y-4">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] px-1">Configure Navigation Link</label>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Link Label"
                value={isLinkObj ? value.label : field.label}
                onChange={(e) => {
                  const newValue = isLinkObj ? { ...value, label: e.target.value } : { label: e.target.value, url: field.url || "", target: field.target || "_self" };
                  onChange(newValue);
                }}
                placeholder="e.g. Documentation"
              />
              <InputField
                label="Redirect URL"
                value={isLinkObj ? value.url : field.url}
                onChange={(e) => {
                  const newValue = isLinkObj ? { ...value, url: e.target.value } : { label: field.label, url: e.target.value, target: field.target || "_self" };
                  onChange(newValue);
                }}
                placeholder="https://..."
                className="font-mono"
              />
            </div>

            <div
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100/50 cursor-pointer"
              onClick={() => {
                const currentTarget = isLinkObj ? value.target : field.target;
                const nextTarget = currentTarget === "_blank" ? "_self" : "_blank";
                const newValue = isLinkObj ? { ...value, target: nextTarget } : { label: field.label, url: field.url || "", target: nextTarget };
                onChange(newValue);
              }}
            >
              <span className="text-[10px] font-black text-indigo-900 uppercase">Open in New Tab</span>
              <div className={`w-10 h-5 rounded-full transition-all relative p-1 ${(isLinkObj ? value.target : field.target) === "_blank" ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-all ${(isLinkObj ? value.target : field.target) === "_blank" ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="#"
                className="text-indigo-600 font-bold text-sm underline underline-offset-4 flex items-center gap-1"
                onClick={(e) => e.preventDefault()}
              >
                {isLinkObj ? value.label : field.label || "Link Preview"}
                <ExternalLink size={12} />
              </a>
              <span className="text-[9px] font-bold text-indigo-300 uppercase italic">Live UI</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default FieldRenderer;

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
      return (
        <Button className="w-fit">
          {field.label}
        </Button>
      );

    case "link":
      return (
        <Link 
          href="#" 
          label={field.label} 
          className="text-blue-600 hover:underline font-medium" 
        />
      );

    default:
      return null;
  }
};

export default FieldRenderer;

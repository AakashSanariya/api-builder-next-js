import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label className="text-sm font-bold text-gray-700 tracking-tight">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        className={`w-full min-h-[120px] p-4 rounded-2xl border-2 bg-white transition-all duration-200 outline-none resize-none
          ${error 
            ? "border-red-500 focus:ring-4 focus:ring-red-50" 
            : "border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          }
          placeholder:text-gray-300 text-gray-700 font-medium`}
        {...props}
      />
      {error && <span className="text-[11px] font-bold text-red-500 mt-0.5 ml-1">{error}</span>}
    </div>
  );
};

export default TextArea;

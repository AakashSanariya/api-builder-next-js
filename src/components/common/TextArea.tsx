import React from "react";
 
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}
 
const TextArea: React.FC<TextAreaProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 md:gap-1.5 w-full ${className}`}>
      <label className="text-[10px] md:text-sm font-bold text-foreground tracking-tight">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        className={`w-full min-h-[100px] md:min-h-[120px] p-3 md:p-4 rounded-xl md:rounded-2xl border-2 bg-card transition-all duration-200 outline-none resize-none
          ${error 
            ? "border-red-500 focus:ring-4 focus:ring-red-50" 
            : "border-border focus:border-primary focus:ring-4 focus:ring-primary/20"
          }
          placeholder:text-muted-foreground text-sm md:text-base text-foreground font-medium`}
        {...props}
      />
      {error && <span className="text-[10px] md:text-[11px] font-bold text-red-500 mt-0.5 ml-1">{error}</span>}
    </div>
  );
};
 
export default TextArea;

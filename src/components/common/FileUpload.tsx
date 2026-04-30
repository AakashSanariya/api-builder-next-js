"use client";
 
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, File as FileIcon, Image as ImageIcon, Plus } from "lucide-react";
 
interface FileUploadProps {
  label: string;
  name: string;
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  required?: boolean;
  multiple?: boolean;
}
 
const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  value = [],
  onChange,
  error,
  required,
  multiple,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...value, ...selectedFiles]);
    } else {
      onChange(selectedFiles);
    }
  };
 
  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
 
  return (
    <div className="flex flex-col gap-2 md:gap-3 w-full">
      <div className="flex justify-between items-end px-1">
        <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.1em] font-display">
          {label}
          {required && <span className="text-indigo-500 ml-1 font-bold text-base md:text-lg leading-none">*</span>}
        </label>
      </div>
 
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            if (multiple) onChange([...value, ...droppedFiles]);
            else onChange([droppedFiles[0]]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full min-h-36 md:h-44 rounded-xl md:rounded-[2.5rem] border-2 md:border-3 border-dashed flex flex-col items-center justify-center gap-3 md:gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden touch-manipulation
          ${isDragging || value.length > 0 ? "bg-white" : "bg-gray-50/50"}
          ${error 
            ? "border-red-100 ring-4 ring-red-50" 
            : "border-gray-100 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/50 group"
          }
           ${isDragging ? "border-indigo-500 bg-indigo-50/30 scale-[1.01]" : ""}`}
      >
        <div className="relative">
            <motion.div 
                animate={{ y: isDragging ? -5 : 0 }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center shadow-xl text-gray-400 group-hover:text-indigo-600 transition-colors z-10 relative border border-gray-50"
            >
                <Upload size={20} className="" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg z-20">
                <Plus size={12} className="" />
            </div>
        </div>
 
        <div className="text-center px-4">
            <span className="block text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest font-display">
                {multiple ? "Drop files here" : "Drop file here"}
            </span>
            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase mt-1 block">
                or click to browse
            </span>
        </div>
 
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
        />
      </motion.div>
 
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 gap-2 md:gap-3 mt-3 md:mt-4"
          >
            {value.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 md:p-4 bg-white border border-gray-50 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                  <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl shrink-0 ${file.type.startsWith("image/") ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"}`}>
                    {file.type.startsWith("image/") ? <ImageIcon size={16} className="" /> : <FileIcon size={16} className="" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-gray-700 truncate font-display">
                        {file.name}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-1.5 md:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <X size={14} className="" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {error && <span className="text-[10px] md:text-[11px] font-bold text-red-500 px-2 mt-1">{error}</span>}
    </div>
  );
};
 
export default FileUpload;

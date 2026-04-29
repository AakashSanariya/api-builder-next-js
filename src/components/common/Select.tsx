"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Check, Search } from "lucide-react";

interface SelectOption {
  label: string;
  value: string | number;
  id?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: SelectOption[];
  error?: string;
  onChange: (value: any) => void;
}

const Select: React.FC<SelectProps> = ({ label, options, error, className = "", value, onChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isSelected = (opt: SelectOption) => {
    const val = opt.id || (typeof opt.value === 'object' ? JSON.stringify(opt.value) : opt.value);
    if (props.multiple) {
      return Array.isArray(value) && value.some(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)) === String(val));
    }
    return String(value) === String(val);
  };

  const handleSelect = (opt: SelectOption) => {
    const val = opt.id || (typeof opt.value === 'object' ? JSON.stringify(opt.value) : opt.value);
    const parsedVal = typeof val === 'string' && (val.startsWith('{') || val.startsWith('[')) ? JSON.parse(val) : val;

    if (props.multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      const index = currentValues.findIndex(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)) === String(val));
      
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(parsedVal);
      }
      onChange(currentValues);
    } else {
      onChange(parsedVal);
      setIsOpen(false);
    }
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2 w-full relative ${className}`}
    >
      <div className="flex justify-between items-end px-1">
        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.1em] font-display">
          {label}
          {props.required && <span className="text-indigo-500 ml-1 font-bold text-lg leading-none">*</span>}
        </label>
        {props.multiple && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Multi-Select</span>}
      </div>

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-14 px-5 py-3 rounded-[1.25rem] border-2 bg-white transition-all duration-300 flex flex-wrap gap-2 items-center cursor-pointer
          ${error 
            ? "border-red-100 shadow-[0_0_20px_rgb(239,68,68,0.05)]" 
            : isOpen ? "border-indigo-600 shadow-[0_10px_30px_rgb(79,70,229,0.08)]" : "border-gray-50 hover:border-gray-200 bg-gray-50/30"
          }`}
      >
        {!props.multiple && !value && <span className="text-gray-300 font-medium">Select {label.toLowerCase()}...</span>}
        
        {props.multiple && Array.isArray(value) && value.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {value.map((v, i) => {
              const opt = options.find(o => {
                const val = o.id || (typeof o.value === 'object' ? JSON.stringify(o.value) : o.value);
                return String(val) === (typeof v === 'object' ? JSON.stringify(v) : String(v));
              });
              return (
                <motion.span 
                  key={i} 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-tight py-1.5 pl-3 pr-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {opt?.label || String(v)}
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelect(opt || { label: String(v), value: v }); }}
                    className="hover:bg-white/20 rounded-lg p-0.5"
                  >
                    <X size={12} />
                  </button>
                </motion.span>
              );
            })}
          </div>
        ) : (
          !props.multiple && value && (
            <span className="text-gray-700 font-bold">
              {options.find(o => {
                 const val = o.id || (typeof o.value === 'object' ? JSON.stringify(o.value) : o.value);
                 return String(val) === (typeof value === 'object' ? JSON.stringify(value) : String(value));
              })?.label || String(value)}
            </span>
          )
        )}

        <div className="ml-auto text-gray-400 group-hover:text-indigo-500 transition-colors">
          <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.1)] z-50 overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
               <Search size={16} className="text-gray-400" />
               <input 
                  autoFocus
                  placeholder="Filter entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold text-gray-700 w-full placeholder:text-gray-300"
                  onClick={(e) => e.stopPropagation()}
               />
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-3">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const active = isSelected(opt);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSelect(opt); }}
                      className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all duration-200 mb-1 last:mb-0
                        ${active ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-600'}
                      `}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-black font-display uppercase tracking-tight">{opt.label}</span>
                        {opt.id && <span className="text-[9px] font-mono font-bold opacity-50">ID: {opt.id}</span>}
                      </div>
                      {active && <Check size={18} className="text-indigo-600" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No matching entities</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.span 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] font-bold text-red-500 px-2 flex items-center gap-1 mt-1 font-display"
          >
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Select;

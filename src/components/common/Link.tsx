import React from "react";
import NextLink from "next/link";
import { ExternalLink } from "lucide-react";
 
interface LinkProps {
  href: string;
  label: string;
  className?: string;
  isExternal?: boolean;
}
 
const Link: React.FC<LinkProps> = ({ href, label, className = "", isExternal = false }) => {
  const commonStyles = "inline-flex items-center gap-1.5 transition-all duration-200 font-bold hover:text-blue-600 text-sm md:text-base touch-manipulation";
  
  if (isExternal) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`${commonStyles} ${className}`}
      >
        {label}
        <ExternalLink size={12} className="opacity-50" />
      </a>
    );
  }
 
  return (
    <NextLink href={href} className={`${commonStyles} ${className}`}>
      {label}
    </NextLink>
  );
};
 
export default Link;

"use client";

import React from "react";
import { File as FileIcon, ExternalLink } from "lucide-react";

const UPLOAD_URL_RE = /\/uploads\/([^/?#]+)$/;

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)(\?|#|$)/i.test(url);

const filenameFromUrl = (url: string) => {
  const match = url.match(UPLOAD_URL_RE);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return url;
};

interface FileDisplayProps {
  value: any;
  compact?: boolean;
}

const renderItem = (item: any, compact?: boolean) => {
  if (typeof item !== "string") return null;
  if (!UPLOAD_URL_RE.test(item)) return null;
  const name = filenameFromUrl(item);
  const isImage = isImageUrl(item);
  return (
    <a
      key={item}
      href={item}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 transition-colors border border-indigo-100 max-w-full ${
        compact ? "text-[9px]" : "text-[10px]"
      } font-bold`}
      title={item}
    >
      {isImage ? (
        <img
          src={item}
          alt={name}
          className={`rounded-md object-cover ${compact ? "w-5 h-5" : "w-7 h-7"}`}
        />
      ) : (
        <FileIcon size={compact ? 10 : 12} className="shrink-0" />
      )}
      <span className="truncate max-w-[180px]">{name}</span>
      <ExternalLink size={compact ? 8 : 10} className="shrink-0 opacity-60" />
    </a>
  );
};

const collectItems = (value: any, out: any[] = []): any[] => {
  if (Array.isArray(value)) {
    value.forEach((v) => collectItems(v, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectItems(v, out));
  } else {
    out.push(value);
  }
  return out;
};

const FileDisplay: React.FC<FileDisplayProps> = ({ value, compact }) => {
  const items = collectItems(value);
  const rendered = items
    .map((item) => renderItem(item, compact))
    .filter(Boolean);

  if (rendered.length === 0) {
    const text = Array.isArray(value)
      ? value.map((v) => (typeof v === "string" ? v : "[object Object]")).join(", ")
      : typeof value === "string"
      ? value
      : value && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");
    return <span className="text-gray-700">{text || "-"}</span>;
  }

  return <span className="inline-flex flex-wrap gap-1.5">{rendered}</span>;
};

export default FileDisplay;
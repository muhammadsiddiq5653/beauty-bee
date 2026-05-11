"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X, Play, GripVertical } from "lucide-react";
import type { MediaItem } from "@/types";

interface Props {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  folder: string;
}

export default function MediaUploader({ items, onChange, folder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    const newItems: MediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i) / files.length) * 100));
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        newItems.push({ type: data.type === "video" ? "video" : "image", url: data.url });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setUploadProgress(100);
    setUploading(false);
    if (newItems.length > 0) onChange([...items, ...newItems]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <div key={i} className={`relative rounded-xl overflow-hidden border-2 ${i === 0 ? "border-[#e91e8c]" : "border-gray-200"} group`}>
              {item.type === "video" ? (
                <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                  <Play size={24} className="text-white" fill="white" />
                </div>
              ) : (
                <div className="relative w-full aspect-square">
                  <Image src={item.url} alt={`media ${i + 1}`} fill className="object-cover" />
                </div>
              )}
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] bg-[#e91e8c] text-white px-1.5 py-0.5 rounded-full font-bold">Cover</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button type="button" onClick={() => remove(i)} className="bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                <div className="flex gap-1">
                  {i > 0 && <button type="button" onClick={() => moveUp(i)} className="bg-white/80 text-gray-800 rounded-full px-2 py-0.5 text-[10px] font-bold">←</button>}
                  {i < items.length - 1 && <button type="button" onClick={() => moveDown(i)} className="bg-white/80 text-gray-800 rounded-full px-2 py-0.5 text-[10px] font-bold">→</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full h-20 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#e91e8c] hover:text-[#e91e8c] transition-colors disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs font-semibold">Uploading... {uploadProgress}%</span>
          </>
        ) : (
          <>
            <ImagePlus size={20} />
            <span className="text-xs font-semibold">Add photos or videos</span>
            <span className="text-[10px]">Select multiple at once</span>
          </>
        )}
      </button>

      {uploading && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#e91e8c] transition-all duration-200 rounded-full" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

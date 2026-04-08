"use client";

import { useRef, useCallback } from "react";
import { ImageIcon, XIcon } from "./Icons";

interface PhotoUploadProps {
  value: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB input limit
const MAX_OUTPUT_KB = 500; // 500KB output limit

function compressImage(file: File, maxWidth: number): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error("照片太大，請選擇小於 10MB 的照片"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Progressively lower quality if output too large
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > MAX_OUTPUT_KB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("無法讀取照片"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("無法讀取檔案"));
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const dataUrl = await compressImage(file, 800);
        onChange(dataUrl);
      } catch {
        // Silently fail — user can retry
      }

      // Reset file input so re-selecting the same file triggers onChange
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onChange]
  );

  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value}
          alt="Photo preview"
          className="w-20 h-20 object-cover rounded-xl border border-border"
        />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-bg-card border border-border flex items-center justify-center hover:border-accent transition-colors"
        >
          <XIcon size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border rounded-xl text-text-secondary text-sm hover:border-accent transition-colors"
      >
        <ImageIcon size={18} />
        <span>拍照 / 選擇照片</span>
      </button>
    </>
  );
}

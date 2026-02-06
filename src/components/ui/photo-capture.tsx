"use client";

import * as React from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhotoCaptureProps {
  onPhotoSelected?: (file: File) => void;
  photoUrl?: string;
  className?: string;
}

const PhotoCapture = React.forwardRef<HTMLDivElement, PhotoCaptureProps>(
  ({ onPhotoSelected, photoUrl, className }, ref) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<string | undefined>(photoUrl);
    const [isMobile, setIsMobile] = React.useState<boolean>(false);

    React.useEffect(() => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onPhotoSelected?.(file);
      }
    };

    const handleClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onPhotoSelected?.(null as any);
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture={isMobile ? "environment" : undefined}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative inline-block w-full max-w-xs">
            <img
              src={preview}
              alt="Photo preview"
              className="w-full rounded-lg border border-[#E5E1DB] object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#E5E1DB] bg-[#FDFBF7] p-8 cursor-pointer transition-colors hover:border-[#7C2D36] hover:bg-[#F5F1EB]",
              "min-h-[200px]"
            )}
          >
            <Camera className="w-8 h-8 text-[#7C2D36]" />
            <div className="text-center">
              <p className="text-sm font-medium text-[#1A1A1A]">
                {isMobile ? "Tap to take a photo" : "Click to upload a photo"}
              </p>
              <p className="text-xs text-[#6B7280]">or drag and drop</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhotoCapture.displayName = "PhotoCapture";

export { PhotoCapture };

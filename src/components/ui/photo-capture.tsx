"use client";

import * as React from "react";
import { Camera, ImagePlus, X, Loader2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-context";

export interface ScanResult {
  name: string | null;
  producer: string | null;
  vintage: number | null;
  country: string | null;
  region: string | null;
  grapes: string[];
  confidence: "high" | "medium" | "low";
}

export interface PhotoCaptureProps {
  onPhotoSelected?: (file: File) => void;
  photoUrl?: string;
  className?: string;
  enableScan?: boolean;
  onScanResult?: (data: ScanResult) => void;
  onScanStateChange?: (scanning: boolean) => void;
}

const PhotoCapture = React.forwardRef<HTMLDivElement, PhotoCaptureProps>(
  ({ onPhotoSelected, photoUrl, className, enableScan = false, onScanResult, onScanStateChange }, ref) => {
    const { t } = useTranslation();
    const cameraInputRef = React.useRef<HTMLInputElement>(null);
    const libraryInputRef = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<string | undefined>(photoUrl);
    const [isMobile, setIsMobile] = React.useState<boolean>(false);
    const [scanState, setScanState] = React.useState<"idle" | "scanning" | "success" | "low-confidence" | "error" | "offline">("idle");

    React.useEffect(() => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    const runScan = React.useCallback(async (file: File) => {
      if (!enableScan) return;

      try {
        setScanState("scanning");
        onScanStateChange?.(true);

        // Dynamic import to avoid loading resize-image on pages that don't need it
        const { resizeImageToBase64 } = await import("@/lib/resize-image");
        const base64 = await resizeImageToBase64(file, 800);

        // Get auth token from localStorage
        const token = localStorage.getItem("winelog_token");
        if (!token) {
          setScanState("offline");
          return;
        }

        const response = await fetch("/api/scan-label", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Scan API error:", response.status, errorData);
          setScanState("offline");
          return;
        }

        const data: ScanResult = await response.json();

        if (data.confidence === "low") {
          setScanState("low-confidence");
        } else {
          setScanState("success");
        }

        onScanResult?.(data);

        // Auto-clear success state after 3 seconds
        setTimeout(() => {
          setScanState((current) =>
            current === "success" || current === "low-confidence" ? "idle" : current
          );
        }, 4000);
      } catch (err) {
        console.error("Scan failed:", err);
        setScanState("offline");
      } finally {
        onScanStateChange?.(false);
      }
    }, [enableScan, onScanResult, onScanStateChange]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onPhotoSelected?.(file);

        // Trigger scan in parallel
        if (enableScan) {
          runScan(file);
        }
      }
    };

    const handleCameraClick = () => {
      cameraInputRef.current?.click();
    };

    const handleLibraryClick = () => {
      libraryInputRef.current?.click();
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(undefined);
      setScanState("idle");
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (libraryInputRef.current) libraryInputRef.current.value = "";
      onPhotoSelected?.(null as any);
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        {/* Camera input — opens camera directly on mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Library input — opens photo picker / file browser */}
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative inline-block w-full max-w-xs">
            <img
              src={preview}
              alt="Photo preview"
              className={cn(
                "w-full rounded-lg border-2 object-cover transition-all duration-300",
                scanState === "scanning"
                  ? "border-[#7C2D36] animate-pulse"
                  : scanState === "success"
                  ? "border-green-500"
                  : scanState === "low-confidence"
                  ? "border-amber-500"
                  : "border-[#E5E1DB]"
              )}
            />

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scan status overlay at bottom of preview */}
            {scanState === "scanning" && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#7C2D36]/90 via-[#7C2D36]/60 to-transparent rounded-b-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <span className="text-white text-xs font-medium">{t("scan.scanning")}</span>
              </div>
            )}

            {scanState === "success" && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-700/90 via-green-600/60 to-transparent rounded-b-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{t("scan.success")}</span>
              </div>
            )}

            {scanState === "low-confidence" && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-700/90 via-amber-600/60 to-transparent rounded-b-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                </div>
                <span className="text-white text-xs font-medium">{t("scan.low_confidence")}</span>
              </div>
            )}

            {scanState === "offline" && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent rounded-b-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span className="text-white/90 text-xs font-medium leading-tight">{t("scan.offline")}</span>
              </div>
            )}
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E1DB] bg-[#FDFBF7] p-6 transition-colors active:border-[#7C2D36] active:bg-[#F5F1EB]"
              >
                <Camera className="w-7 h-7 text-[#7C2D36]" />
                <span className="text-sm font-medium text-[#1A1A1A]">{t("scan.take_photo")}</span>
              </button>
              <button
                type="button"
                onClick={handleLibraryClick}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E1DB] bg-[#FDFBF7] p-6 transition-colors active:border-[#7C2D36] active:bg-[#F5F1EB]"
              >
                <ImagePlus className="w-7 h-7 text-[#7C2D36]" />
                <span className="text-sm font-medium text-[#1A1A1A]">{t("scan.choose_photo")}</span>
              </button>
            </div>
            {enableScan && (
              <p className="text-xs text-[#6B7280] text-center">{t("scan.auto_fill_hint")}</p>
            )}
          </div>
        ) : (
          <div
            onClick={handleLibraryClick}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#E5E1DB] bg-[#FDFBF7] p-8 cursor-pointer transition-colors hover:border-[#7C2D36] hover:bg-[#F5F1EB]",
              "min-h-[200px]"
            )}
          >
            <Camera className="w-8 h-8 text-[#7C2D36]" />
            <div className="text-center">
              <p className="text-sm font-medium text-[#1A1A1A]">
                {t("scan.photo_prompt_desktop")}
              </p>
              <p className="text-xs text-[#6B7280]">
                {enableScan
                  ? t("scan.auto_fill_hint")
                  : t("scan.drag_drop")}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PhotoCapture.displayName = "PhotoCapture";

export { PhotoCapture };

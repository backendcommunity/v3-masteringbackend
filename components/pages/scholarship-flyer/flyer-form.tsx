"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from "@/components/auth/auth-ui";
import { readPhoto, PhotoError } from "@/lib/scholarship-flyer/image";
import { MAX_NAME_CHARS } from "@/lib/scholarship-flyer/fit-name";
import type { FlyerGround, PhotoShape } from "./flyer-canvas";

const GROUND_OPTIONS: { value: FlyerGround; label: string }[] = [
  { value: "navy", label: "Navy" },
  { value: "white", label: "White" },
];

const SHAPE_OPTIONS: { value: PhotoShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
];

/** Segmented control matching the auth column's input chrome. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <span className={authLabelClass}>{label}</span>
      <div
        className="grid gap-1 rounded-lg p-1"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          background: "#F1F5F9",
          border: "1px solid #E2E8F0",
        }}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="h-9 rounded-md text-[14px] font-medium transition-colors"
              style={{
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#0E1F33" : "#64748B",
                boxShadow: active ? "0 1px 2px rgba(14,31,51,0.10)" : "none",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FlyerFormProps {
  name: string;
  onNameChange: (name: string) => void;
  photoSrc: string | null;
  onPhotoChange: (dataUrl: string | null) => void;
  ground: FlyerGround;
  onGroundChange: (ground: FlyerGround) => void;
  photoShape: PhotoShape;
  onPhotoShapeChange: (shape: PhotoShape) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function FlyerForm({
  name,
  onNameChange,
  photoSrc,
  onPhotoChange,
  ground,
  onGroundChange,
  photoShape,
  onPhotoShapeChange,
  onGenerate,
  isGenerating,
}: FlyerFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setIsReadingPhoto(true);
    try {
      onPhotoChange(await readPhoto(file));
    } catch (err) {
      setPhotoError(
        err instanceof PhotoError
          ? err.message
          : "That image couldn't be used. Try another one.",
      );
    } finally {
      setIsReadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canGenerate = name.trim().length > 0 && !isGenerating && !isReadingPhoto;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="flyer-name" className={authLabelClass}>
          Your name
        </label>
        <input
          id="flyer-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your name"
          maxLength={40}
          autoComplete="name"
          className={authInputClass}
        />
        <p className="mt-2 text-[13px]" style={{ color: "#64748B" }}>
          {name.trim().length > MAX_NAME_CHARS
            ? `Over ${MAX_NAME_CHARS} characters — the flyer will shorten it.`
            : "This is the only name that appears on the flyer."}
        </p>
      </div>

      <div>
        <span className={authLabelClass}>Your photo</span>
        <input
          id="flyer-photo"
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex items-center gap-3">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Your photo"
              className="flex-shrink-0 object-cover"
              style={{
                width: 52,
                height: 52,
                borderRadius: photoShape === "circle" ? "50%" : 8,
                border: "1px solid #E2E8F0",
              }}
            />
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isReadingPhoto}
            className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg text-[14.5px] font-medium transition disabled:opacity-50"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0E1F33" }}
          >
            {isReadingPhoto ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {photoSrc ? "Change photo" : "Choose a photo"}
          </button>
          {photoSrc ? (
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="h-[46px] rounded-lg px-4 text-[14.5px] font-medium transition"
              style={{ color: "#64748B" }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <p
          className="mt-2 text-[13px]"
          style={{ color: photoError ? "#DC2626" : "#64748B" }}
          role={photoError ? "alert" : undefined}
        >
          {photoError ?? "Stays on your device — it is never uploaded. Up to 8MB."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Segmented
          label="Photo shape"
          options={SHAPE_OPTIONS}
          value={photoShape}
          onChange={onPhotoShapeChange}
        />
        <Segmented
          label="Background"
          options={GROUND_OPTIONS}
          value={ground}
          onChange={onGroundChange}
        />
      </div>

      <button type="button" onClick={onGenerate} disabled={!canGenerate} className={authPrimaryBtnClass}>
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          "Generate my flyer"
        )}
      </button>
    </div>
  );
}

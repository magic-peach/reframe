"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import { EditRecipe, DEFAULT_RECIPE } from "@/lib/types";

export default function VideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);

  const update = (patch: Partial<EditRecipe>) => setRecipe((r) => ({ ...r, ...patch }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">🎬 Video Editor</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FileUpload onFileSelect={setFile} currentFile={file} />
          <VideoPreview file={file} />
        </div>
        <div className="space-y-4">
          <PresetSelector recipe={recipe} onChange={update} />
        </div>
      </div>
    </div>
  );
}

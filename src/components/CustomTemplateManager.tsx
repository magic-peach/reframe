"use client";

import { useEffect, useState } from "react";

import {
  getTemplates,
  deleteTemplate,
  renameTemplate,
} from "@/lib/templateStorage";

interface Props {
  onApplyTemplate: (recipe: any) => void;
}

export default function CustomTemplateManager({
  onApplyTemplate,
}: Props) {
  const [templates, setTemplates] = useState<any[]>([]);

  const refreshTemplates = () => {
    setTemplates(getTemplates());
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  return (
    <div className="space-y-3">
      {templates.length === 0 && (
        <p className="text-xs text-[var(--muted)]">
          No saved templates
        </p>
      )}

      {templates.map((template) => (
        <div
          key={template.id}
          className="border border-[var(--border)] rounded-lg p-3"
        >
          <p className="text-sm font-medium mb-2">
            {template.name}
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onApplyTemplate(template.recipe)}
              className="text-xs px-2 py-1 border rounded"
            >
              Apply
            </button>

            <button
              onClick={() => {
                const name = prompt(
                  "Rename template",
                  template.name
                );

                if (!name) return;

                renameTemplate(template.id, name);
                refreshTemplates();
              }}
              className="text-xs px-2 py-1 border rounded"
            >
              Rename
            </button>

            <button
              onClick={() => {
                deleteTemplate(template.id);
                refreshTemplates();
              }}
              className="text-xs px-2 py-1 border rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
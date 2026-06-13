export interface CustomTemplate {
  id: string;
  name: string;
  recipe: any;
}

const STORAGE_KEY = "reframe-custom-templates";

export const getTemplates = (): CustomTemplate[] => {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveTemplate = (template: CustomTemplate) => {
  const templates = getTemplates();

  templates.push(template);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(templates)
  );

  console.log("Saved templates:", templates);
};

export const deleteTemplate = (id: string) => {
  const updated = getTemplates().filter(
    (template) => template.id !== id
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
};

export const renameTemplate = (
  id: string,
  name: string
) => {
  const updated = getTemplates().map(
    (template) =>
      template.id === id
        ? { ...template, name }
        : template
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
};
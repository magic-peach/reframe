export interface TemplateRecipe {
  [key: string]: unknown;
}

export interface CustomTemplate {
  id: string;
  name: string;
  recipe: TemplateRecipe;
}

const STORAGE_KEY = "reframe-custom-templates";

export const getTemplates = (): CustomTemplate[] => {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load templates:", error);
    return [];
  }
};

export const saveTemplate = (
  template: CustomTemplate
): boolean => {
  try {
    const templates = getTemplates();

    templates.push(template);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(templates)
    );

    return true;
  } catch (error) {
    console.error("Failed to save template:", error);
    return false;
  }
};

export const deleteTemplate = (
  id: string
): boolean => {
  try {
    const updated = getTemplates().filter(
      (template) => template.id !== id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return true;
  } catch (error) {
    console.error("Failed to delete template:", error);
    return false;
  }
};

export const renameTemplate = (
  id: string,
  name: string
): boolean => {
  try {
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

    return true;
  } catch (error) {
    console.error("Failed to rename template:", error);
    return false;
  }
};
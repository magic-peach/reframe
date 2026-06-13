export interface SavedTemplate {
    id: string;
    name: string;
    recipe: any;
}

const STORAGE_KEY = "reframe-custom-templates";

export function getTemplates(): SavedTemplate[] {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];
}

export function saveTemplate(template: SavedTemplate) {
    const templates = getTemplates();

    templates.push(template);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(templates)
    );
}

export function deleteTemplate(id: string) {
    const templates = getTemplates().filter(
        (t) => t.id !== id
    );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(templates)
    );
}

export function renameTemplate(
    id: string,
    newName: string
) {
    const templates = getTemplates().map((t) =>
        t.id === id
            ? { ...t, name: newName }
            : t
    );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(templates)
    );
}
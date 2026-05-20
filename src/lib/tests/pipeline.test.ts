import { describe, it, expect } from "vitest";
import { parsePipelineConfig } from "../pipeline";

describe("parsePipelineConfig", () => {
  it("should parse valid JSON configuration", () => {
    const jsonText = `{
      "name": "JSON Dataset Prep",
      "pipeline": [
        { "step": "extract_frames", "fps": 2, "format": "webp" },
        { "step": "resize", "width": 512, "height": 512 }
      ]
    }`;

    const config = parsePipelineConfig(jsonText);
    expect(config.name).toBe("JSON Dataset Prep");
    expect(config.pipeline).toHaveLength(2);
    expect(config.pipeline[0].step).toBe("extract_frames");
    expect(config.pipeline[0].fps).toBe(2);
    expect(config.pipeline[0].format).toBe("webp");
    expect(config.pipeline[1].width).toBe(512);
  });

  it("should parse valid YAML configuration", () => {
    const yamlText = `name: "YAML Dataset Prep"
pipeline:
  - step: extract_frames
    fps: 2.5
    format: png
  - step: remove_background
    color: green
    similarity: 0.18
    enabled: true
  - step: resize
    width: 600
    height: 600
`;

    const config = parsePipelineConfig(yamlText);
    expect(config.name).toBe("YAML Dataset Prep");
    expect(config.pipeline).toHaveLength(3);
    
    const step1 = config.pipeline[0];
    expect(step1.step).toBe("extract_frames");
    expect(step1.fps).toBe(2.5);
    expect(step1.format).toBe("png");

    const step2 = config.pipeline[1];
    expect(step2.step).toBe("remove_background");
    expect(step2.color).toBe("green");
    expect(step2.similarity).toBe(0.18);
    expect(step2.enabled).toBe(true);

    const step3 = config.pipeline[2];
    expect(step3.step).toBe("resize");
    expect(step3.width).toBe(600);
    expect(step3.height).toBe(600);
  });

  it("should handle YAML comment lines and empty lines", () => {
    const yamlText = `# This is a comment
name: "Comments Workflow"

pipeline:
  - step: trim # inline comment
    start: 0
    end: 10
`;

    const config = parsePipelineConfig(yamlText);
    expect(config.name).toBe("Comments Workflow");
    expect(config.pipeline).toHaveLength(1);
    expect(config.pipeline[0].step).toBe("trim");
    expect(config.pipeline[0].start).toBe(0);
    expect(config.pipeline[0].end).toBe(10);
  });

  it("should throw error on invalid JSON", () => {
    const invalidJson = `{ "name": "Invalid", "pipeline": [ { "step" } ] }`;
    expect(() => parsePipelineConfig(invalidJson)).toThrow();
  });

  it("should throw error if no pipeline steps found", () => {
    const emptyYaml = `name: "Empty"\npipeline:\n`;
    expect(() => parsePipelineConfig(emptyYaml)).toThrow();
  });
});

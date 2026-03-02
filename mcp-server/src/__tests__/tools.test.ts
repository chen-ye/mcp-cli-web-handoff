import { delegateWebResearchSchema, handleDelegateWebResearch } from "../tools";
import fs from "fs";
import AdmZip from "adm-zip";

jest.mock("../client", () => ({
  ensureDaemonRunning: jest.fn().mockResolvedValue("mock-token"),
  sendPromptToDaemon: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock("adm-zip", () => {
  const mZip = {
    addFile: jest.fn(),
    toBuffer: jest.fn().mockReturnValue(Buffer.from("mock-zip-buffer")),
  };
  return jest.fn(() => mZip);
});

describe("delegate_web_research tool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should validate the input schema", () => {
    const result = delegateWebResearchSchema.safeParse({ prompt: "What is the latest React version?" });
    expect(result.success).toBe(true);
  });

  it("should fail validation if prompt is missing", () => {
    const result = delegateWebResearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should validate when valid context_files are provided", () => {
    const result = delegateWebResearchSchema.safeParse({ 
      prompt: "test", 
      context_files: ["file1.txt", "file2.txt"] 
    });
    expect(result.success).toBe(true);
  });

  it("should fail validation if more than 10 context_files are provided", () => {
    const result = delegateWebResearchSchema.safeParse({ 
      prompt: "test", 
      context_files: Array.from({ length: 11 }, (_, i) => `file${i}.txt`) 
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("must contain at most 10");
    }
  });

  it("should return a suspension message when handled", async () => {
    const response = await handleDelegateWebResearch({ prompt: "test" });
    expect(response.isError).toBeUndefined();
    expect(response.content[0].text).toContain("Delegated web research");
    expect(response.content[0].text).toContain("mock-token");
  });

  it("should read files and create a zip buffer when context_files are provided", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("file content"));

    const response = await handleDelegateWebResearch({ 
      prompt: "test",
      context_files: ["file1.txt", "file2.txt"]
    });

    expect(response.isError).toBeUndefined();
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(AdmZip).toHaveBeenCalled();
    const mockZipInstance = new (AdmZip as any)();
    expect(mockZipInstance.addFile).toHaveBeenCalledTimes(2);
    expect(mockZipInstance.toBuffer).toHaveBeenCalled();
  });

  it("should ignore missing files when creating a zip buffer", async () => {
    (fs.existsSync as jest.Mock).mockImplementation((path) => path === "file1.txt");
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("file content"));

    const response = await handleDelegateWebResearch({ 
      prompt: "test",
      context_files: ["file1.txt", "missing.txt"]
    });

    expect(response.isError).toBeUndefined();
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1); // Only called for the existing file
    const mockZipInstance = new (AdmZip as any)();
    expect(mockZipInstance.addFile).toHaveBeenCalledTimes(1);
  });
});

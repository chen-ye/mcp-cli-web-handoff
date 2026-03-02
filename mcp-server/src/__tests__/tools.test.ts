import { delegateWebResearchSchema, handleDelegateWebResearch } from "../tools";

jest.mock("../client", () => ({
  ensureDaemonRunning: jest.fn().mockResolvedValue("mock-token"),
  sendPromptToDaemon: jest.fn().mockResolvedValue(undefined),
}));

describe("delegate_web_research tool", () => {
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
});

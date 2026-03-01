import { delegateWebResearchSchema, handleDelegateWebResearch } from "../tools";

describe("delegate_web_research tool", () => {
  it("should validate the input schema", () => {
    const result = delegateWebResearchSchema.safeParse({ prompt: "What is the latest React version?" });
    expect(result.success).toBe(true);
  });

  it("should fail validation if prompt is missing", () => {
    const result = delegateWebResearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should return a suspension message when handled", async () => {
    const response = await handleDelegateWebResearch({ prompt: "test" });
    expect(response.content[0].text).toContain("Delegated web research");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCallAiProxy = vi.fn();

vi.mock("@/services/ai-chat.service", () => ({
  callAiProxy: (...args: unknown[]) => mockCallAiProxy(...args),
}));

const { generatePreRetroSummary } = await import("@/services/mail-content");

describe("generatePreRetroSummary", () => {
  const defaultParams = {
    completedCount: 5,
    openCount: 3,
    failedCount: 1,
    openActions: [
      { title: "Fix CI pipeline", assigneeName: "Ali" },
      { title: "Update docs", assigneeName: null },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return AI-generated subject and body on success", async () => {
    mockCallAiProxy.mockResolvedValue(
      JSON.stringify({
        subject: "Sprint Özeti 🎯",
        body: "Harika bir sprint geçirdik!",
      }),
    );

    const result = await generatePreRetroSummary(defaultParams);
    expect(result.subject).toBe("Sprint Özeti 🎯");
    expect(result.body).toBe("Harika bir sprint geçirdik!");
  });

  it("should handle JSON wrapped in markdown code fences", async () => {
    mockCallAiProxy.mockResolvedValue(
      '```json\n{"subject": "Özet", "body": "Merhaba"}\n```',
    );

    const result = await generatePreRetroSummary(defaultParams);
    expect(result.subject).toBe("Özet");
    expect(result.body).toBe("Merhaba");
  });

  it("should return fallback when AI returns invalid JSON", async () => {
    mockCallAiProxy.mockResolvedValue("Bu geçerli JSON değil");

    const result = await generatePreRetroSummary(defaultParams);
    expect(result.subject).toContain("retro");
    expect(result.body).toBeTruthy();
  });

  it("should return fallback when AI returns missing fields", async () => {
    mockCallAiProxy.mockResolvedValue(JSON.stringify({ subject: "only subject" }));

    const result = await generatePreRetroSummary(defaultParams);
    expect(result.subject).toContain("retro");
  });

  it("should return fallback when callAiProxy throws", async () => {
    mockCallAiProxy.mockRejectedValue(new Error("AI service down"));

    const result = await generatePreRetroSummary(defaultParams);
    expect(result.subject).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it("should include action stats in prompt", async () => {
    mockCallAiProxy.mockResolvedValue(
      JSON.stringify({ subject: "s", body: "b" }),
    );

    await generatePreRetroSummary(defaultParams);

    const prompt = mockCallAiProxy.mock.calls[0][0][0].content as string;
    expect(prompt).toContain("Tamamlanan: 5");
    expect(prompt).toContain("Devam eden: 3");
    expect(prompt).toContain("Yapılamayan: 1");
    expect(prompt).toContain("Fix CI pipeline");
    expect(prompt).toContain("Update docs");
  });
});

import { describe, expect, it } from "vitest";

import { renderPreRetroSummaryMail } from "@/templates/pre-retro-summary.html";

describe("renderPreRetroSummaryMail", () => {
  const defaultParams = {
    subject: "Sprint Özeti Hazır!",
    body: "Harika bir sprint geçirdik ekip!",
    completedCount: 5,
    openCount: 3,
    failedCount: 1,
    openActions: [
      { title: "CI/CD pipeline düzelt", assigneeName: "Ahmet" },
      { title: "Test coverage artır", assigneeName: null },
    ],
    retroUrl: "http://localhost:3000/retros/retro-123",
  };

  it("should return valid HTML", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should include subject in header", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("Sprint Özeti Hazır!");
  });

  it("should include RetroFlow branding", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("RetroFlow");
    expect(html).toContain("#6366f1");
  });

  it("should include stat counts", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain(">5<");
    expect(html).toContain(">3<");
    expect(html).toContain(">1<");
  });

  it("should include stat labels", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("Tamamlanan");
    expect(html).toContain("Devam Eden");
    expect(html).toContain("Yapılamayan");
  });

  it("should include action titles", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("CI/CD pipeline düzelt");
    expect(html).toContain("Test coverage artır");
  });

  it("should include assignee name when present", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("Ahmet");
  });

  it("should include body text", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("Harika bir sprint geçirdik ekip!");
  });

  it("should include retro join link", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("http://localhost:3000/retros/retro-123");
    expect(html).toContain("Retroya Katıl");
  });

  it("should omit actions section when no open actions", () => {
    const html = renderPreRetroSummaryMail({
      ...defaultParams,
      openActions: [],
    });
    expect(html).not.toContain("Açık Aksiyonlar");
  });

  it("should include footer", () => {
    const html = renderPreRetroSummaryMail(defaultParams);
    expect(html).toContain("RetroFlow tarafından otomatik gönderilmiştir");
  });
});

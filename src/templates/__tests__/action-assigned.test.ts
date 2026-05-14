import { describe, expect, it } from "vitest";

import { buildActionAssignedHtml } from "@/templates/action-assigned.html";

describe("buildActionAssignedHtml", () => {
  const defaultParams = {
    actionTitle: "CI/CD pipeline düzelt",
    groupTitle: "DevOps Sorunları",
    assigneeName: "Ahmet",
    deadline: "2026-06-01",
    magicToken: "abc-123-def",
    appUrl: "http://localhost:3000",
    mailBody: "Merhaba! Bu aksiyon çok önemli.",
  };

  it("should return valid HTML", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should include action title", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("CI/CD pipeline düzelt");
  });

  it("should include group title", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("DevOps Sorunları");
  });

  it("should include assignee name", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("Ahmet");
  });

  it("should include deadline", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("2026-06-01");
  });

  it("should include CTA link with magic token", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain(
      "http://localhost:3000/action-update/abc-123-def",
    );
  });

  it("should include mail body content", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("Bu aksiyon çok önemli.");
  });

  it("should handle null deadline", () => {
    const html = buildActionAssignedHtml({
      ...defaultParams,
      deadline: null,
    });
    expect(html).toContain("Belirtilmemiş");
  });

  it("should escape HTML in mail body", () => {
    const html = buildActionAssignedHtml({
      ...defaultParams,
      mailBody: "<script>alert('xss')</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("should include RetroFlow branding", () => {
    const html = buildActionAssignedHtml(defaultParams);
    expect(html).toContain("RetroFlow");
    expect(html).toContain("#034EA2");
  });
});

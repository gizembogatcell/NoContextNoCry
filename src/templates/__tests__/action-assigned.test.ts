import { describe, expect, it } from "vitest";

import { renderActionAssignedMail } from "@/templates/action-assigned.html";

describe("renderActionAssignedMail", () => {
  const defaultParams = {
    subject: "Yeni aksiyon atandı",
    body: "Merhaba! Bu aksiyon çok önemli.",
    actionTitle: "CI/CD pipeline düzelt",
    assigneeName: "Ahmet",
    deadline: "2026-06-01",
    appUrl: "http://localhost:3000",
  };

  it("should return valid HTML", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should include action title", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("CI/CD pipeline düzelt");
  });

  it("should include subject in header", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("Yeni aksiyon atandı");
  });

  it("should include assignee name in greeting", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("Ahmet");
  });

  it("should include deadline", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("2026-06-01");
  });

  it("should include CTA link to dashboard", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("http://localhost:3000/dashboard");
  });

  it("should include mail body content", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("Bu aksiyon çok önemli.");
  });

  it("should handle null deadline by omitting deadline row", () => {
    const html = renderActionAssignedMail({
      ...defaultParams,
      deadline: null,
    });
    expect(html).not.toContain("Deadline");
  });

  it("should handle null assigneeName with generic greeting", () => {
    const html = renderActionAssignedMail({
      ...defaultParams,
      assigneeName: null,
    });
    expect(html).toContain("Merhaba! 👋");
    expect(html).not.toContain("Ahmet");
  });

  it("should include RetroMind branding", () => {
    const html = renderActionAssignedMail(defaultParams);
    expect(html).toContain("RetroMind");
    expect(html).toContain("#6366f1");
  });
});

import { describe, expect, it, vi } from "vitest";
import { persistReport } from "@/lib/report-submission";

const report = { person_id: "nora", reason: "Fake profile or scam", note: "Test report" };

describe("report submission", () => {
  it("confirms only after the report is saved", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });

    await expect(persistReport(insert, report)).resolves.toBe(true);
    expect(insert).toHaveBeenCalledWith(report);
  });

  it("does not confirm a failed or rejected save", async () => {
    const insert = vi.fn().mockResolvedValue({ error: new Error("database unavailable") });
    const rejectedInsert = vi.fn().mockRejectedValue(new Error("network unavailable"));

    await expect(persistReport(insert, report)).resolves.toBe(false);
    await expect(persistReport(rejectedInsert, report)).resolves.toBe(false);
  });
});
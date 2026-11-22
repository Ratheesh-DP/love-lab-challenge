export type ReportPayload = {
  person_id: string;
  reason: string;
  note: string;
};

type InsertReport = (payload: ReportPayload) => PromiseLike<{ error: unknown | null }>;

export async function persistReport(insertReport: InsertReport, payload: ReportPayload): Promise<boolean> {
  try {
    const { error } = await insertReport(payload);
    return error === null;
  } catch {
    return false;
  }
}
import { apiClient } from "./client";
import {
  buildChildExportArchiveFilename,
  buildChildExportFilename,
  extractFilenameFromContentDisposition,
  resolveChildExportApiPeriod,
  type ChildExportKind,
  type ChildExportPeriod,
} from "./childExports";
import { finalizeChildExportDownload } from "./childExportDelivery";

export type { ChildExportKind, ChildExportPeriod } from "./childExports";

export async function downloadChildExportCsv(args: {
  childId: string;
  childName: string;
  exportKind: ChildExportKind;
  period: ChildExportPeriod;
  format?: "csv" | "xlsx";
}): Promise<string> {
  const resolvedPeriod = resolveChildExportApiPeriod(args.period);
  const params: Record<string, string> =
    resolvedPeriod.period === "all"
      ? { period: "all" }
      : {
          period: "custom",
          start_date: resolvedPeriod.startDate,
          end_date: resolvedPeriod.endDate,
        };
  params.format = args.format ?? "csv";

  const res = await apiClient.get<Blob>(`/children/${args.childId}/exports/${args.exportKind}`, {
    params,
    responseType: "blob",
  });
  const filename =
    extractFilenameFromContentDisposition(res.headers["content-disposition"]) ??
    buildChildExportFilename(
      args.childName,
      args.exportKind,
      args.format === "xlsx" ? "xlsx" : "csv",
    );
  const blob =
    res.data instanceof Blob
      ? res.data
      : new Blob([res.data], {
          type:
            args.format === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/csv",
        });
  return (await finalizeChildExportDownload(blob, filename)).filename;
}

export async function downloadChildExportArchive(args: {
  childId: string;
  childName: string;
  period: ChildExportPeriod;
  format?: "zip" | "xlsx";
}): Promise<string> {
  const resolvedPeriod = resolveChildExportApiPeriod(args.period);
  const params: Record<string, string> =
    resolvedPeriod.period === "all"
      ? { period: "all" }
      : {
          period: "custom",
          start_date: resolvedPeriod.startDate,
          end_date: resolvedPeriod.endDate,
        };
  params.format = args.format ?? "zip";

  const res = await apiClient.get<Blob>(`/children/${args.childId}/exports/archive`, {
    params,
    responseType: "blob",
  });
  const filename =
    extractFilenameFromContentDisposition(res.headers["content-disposition"]) ??
    buildChildExportArchiveFilename(args.childName, args.format === "xlsx" ? "xlsx" : "zip");
  const blob =
    res.data instanceof Blob
      ? res.data
      : new Blob([res.data], {
          type:
            args.format === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/zip",
        });
  return (await finalizeChildExportDownload(blob, filename)).filename;
}

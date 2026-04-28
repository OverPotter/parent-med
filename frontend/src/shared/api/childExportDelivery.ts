import { Capacitor, registerPlugin } from "@capacitor/core";
import { type ChildExportDeliveryResult, isNativeIosExportRuntime } from "./childExports";

type NativeFileSharePlugin = {
  shareFile(args: {
    filename: string;
    base64: string;
  }): Promise<{ activityType?: string; completed?: boolean; canceled?: boolean }>;
};

const NativeFileShare = registerPlugin<NativeFileSharePlugin>("NativeFileShare");

function isNativeIosRuntime(): boolean {
  return isNativeIosExportRuntime({
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read export file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to convert export file"));
        return;
      }
      const base64 = result.split(",", 2)[1];
      if (!base64) {
        reject(new Error("Failed to convert export file"));
        return;
      }
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

async function saveAndShareNativeExport(
  blob: Blob,
  filename: string
): Promise<ChildExportDeliveryResult> {
  const base64 = await blobToBase64(blob);
  const result = await NativeFileShare.shareFile({
    filename,
    base64,
  });
  if (result.canceled) {
    return { status: "cancelled", filename };
  }
  return { status: "shared", filename };
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function finalizeChildExportDownload(
  blob: Blob,
  filename: string
): Promise<ChildExportDeliveryResult> {
  if (isNativeIosRuntime()) {
    return await saveAndShareNativeExport(blob, filename);
  }

  triggerBrowserDownload(blob, filename);
  return { status: "downloaded", filename };
}

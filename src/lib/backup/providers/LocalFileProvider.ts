import type { BackupProvider, BackupEnvelope } from "../types";

export class LocalFileProvider implements BackupProvider {
  id = "local-file";
  name = "Local File";

  async connect(): Promise<void> {
    // Local file is always connected implicitly
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  isConnected(): boolean {
    return true;
  }

  async createBackup(envelope: BackupEnvelope): Promise<void> {
    try {
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const now = new Date();
      const localDateString = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
      a.download = `studentos-backup-${localDateString}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create local backup file:", error);
      throw new Error("Failed to export backup file.", { cause: error });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async restoreBackup(source?: any): Promise<BackupEnvelope | null> {
    if (!source) return null;
    let content: string;

    if (typeof source === "string") {
      content = source;
    } else if (source instanceof File) {
      content = await source.text();
    } else {
      throw new Error("Unsupported restore source for LocalFileProvider");
    }

    if (!content) {
      throw new Error("Backup file is empty.");
    }

    // Explicit date reviver for restoring stringified ISO dates back to Date objects safely
    const dateReviver = (_key: string, value: unknown) => {
      if (typeof value === 'string') {
          const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?$/;
          if (isoDateRegex.test(value)) {
              return new Date(value);
          }
      }
      return value;
    };

    try {
      const parsed = JSON.parse(content, dateReviver);
      return parsed as BackupEnvelope;
    } catch (error) {
      throw new Error("Failed to parse backup JSON. File may be corrupted.", { cause: error });
    }
  }
}

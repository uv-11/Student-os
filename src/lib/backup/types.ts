export interface BackupMetadata {
  schemaVersion: string;
  appVersion: string;
  createdAt: number;
  backupId: string;
}

export interface BackupEnvelope {
  metadata: BackupMetadata;
  data: {
    attendance?: unknown;
    assignments?: unknown;
    habits?: unknown;
    pomodoro?: unknown;
    study?: unknown;
    calendar?: unknown;
    courses?: unknown;
    todos?: unknown;
    user?: unknown;
    appSettings?: unknown;
    // Extensible for future domains
    [domain: string]: unknown;
  };
}

export interface RestoreResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  skippedEntities: number;
}

export interface BackupProvider {
  id: string;
  name: string;
  
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  
  createBackup: (envelope: BackupEnvelope) => Promise<void>;
  
  // The source can be anything depending on the provider.
  // For LocalFileProvider, it could be a File object or raw string content.
  restoreBackup: (source?: unknown) => Promise<BackupEnvelope | null>;
}

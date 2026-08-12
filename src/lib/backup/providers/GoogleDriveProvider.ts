import type { BackupProvider, BackupEnvelope } from "../types";

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size: string;
}

export class GoogleDriveProvider implements BackupProvider {
  id = "google-drive";
  name = "Google Drive";

  private token: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tokenClient: any = null;
  private isGoogleScriptLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private get clientId(): string {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  }

  constructor() {
    // We don't eagerly load to respect "no unnecessary network until requested"
  }

  private async loadGoogleApi(): Promise<void> {
    if (this.isGoogleScriptLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    if (!this.clientId) {
      throw new Error("Google Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID in your environment.");
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGoogleScriptLoaded = true;
        
        // Initialize the token client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: "https://www.googleapis.com/auth/drive.file",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (response: any) => {
            if (response.error !== undefined) {
              reject(response);
            }
            // Handled in the requestAccessToken wrapper
          },
        });
        
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }

  private async requestToken(): Promise<string> {
    if (this.token) return this.token; // Could check expiration here if we track it
    
    await this.loadGoogleApi();

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(new Error("Google Auth Error: " + response.error));
          return;
        }
        this.token = response.access_token;
        resolve(this.token!);
      };
      
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async connect(): Promise<void> {
    await this.requestToken();
  }

  async disconnect(): Promise<void> {
    if (this.token) {
      // Optional: revoke the token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (this.isGoogleScriptLoaded && (window as any).google) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google.accounts.oauth2.revoke(this.token, () => {});
      }
    }
    this.token = null;
  }

  isConnected(): boolean {
    return !!this.token;
  }

  /**
   * Finds the "StudentOS" backup folder, or creates it if it doesn't exist.
   */
  private async getOrCreateBackupFolder(): Promise<string> {
    const token = await this.requestToken();
    
    // Search for folder
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='StudentOS Backups' and trashed=false");
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchRes.ok) throw new Error("Failed to search for backup folder in Google Drive");
    
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "StudentOS Backups",
        mimeType: "application/vnd.google-apps.folder"
      })
    });

    if (!createRes.ok) throw new Error("Failed to create backup folder in Google Drive");
    const createData = await createRes.json();
    return createData.id;
  }

  async createBackup(envelope: BackupEnvelope): Promise<void> {
    const folderId = await this.getOrCreateBackupFolder();
    const token = await this.requestToken();

    const now = new Date();
    const localDateString = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const filename = `studentos-backup-${localDateString}.json`;
    
    const fileContent = JSON.stringify(envelope, null, 2);
    
    // We use a multipart upload to set metadata (name, parent) and content in one request
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: filename,
      parents: [folderId],
      mimeType: "application/json"
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      fileContent +
      close_delim;

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      throw new Error("Failed to upload backup to Google Drive");
    }
  }

  async listBackups(): Promise<GoogleDriveBackupFile[]> {
    const folderId = await this.getOrCreateBackupFolder();
    const token = await this.requestToken();

    const query = encodeURIComponent(`'${folderId}' in parents and mimeType='application/json' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to list backups from Google Drive");
    const data = await res.json();
    return data.files || [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async restoreBackup(source?: any): Promise<BackupEnvelope | null> {
    if (!source || typeof source !== "string") {
      throw new Error("Invalid source for GoogleDriveProvider restore. Expected a file ID string.");
    }

    const fileId = source;
    const token = await this.requestToken();

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Failed to download backup from Google Drive");
    }

    const content = await res.text();
    
    if (!content) {
      throw new Error("Backup file is empty.");
    }

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

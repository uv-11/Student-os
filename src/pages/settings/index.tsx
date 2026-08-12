import { useState, useRef } from "react";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { Toast } from "../../components/ui/Toast";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsCard } from "../../components/settings/SettingsCard";
import { ToggleRow } from "../../components/settings/ToggleRow";
import { SelectRow } from "../../components/settings/SelectRow";
import { DangerZone } from "../../components/settings/DangerZone";
import { Button } from "../../components/ui/Button";
import { useAppStore } from "../../store/appStore";
import { useAssignmentStore } from "../../store/assignmentStore";
import { useHabitStore } from "../../store/habitStore";
import { BackupEngine } from "../../lib/backup/BackupEngine";
import { LocalFileProvider } from "../../lib/backup/providers/LocalFileProvider";
import { GoogleDriveProvider, type GoogleDriveBackupFile } from "../../lib/backup/providers/GoogleDriveProvider";

const localFileProvider = new LocalFileProvider();
const googleDriveProvider = new GoogleDriveProvider();

export default function SettingsPage() {
  const { settings: appSettings, updateSettings: updateApp } = useAppStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [pendingDriveRestore, setPendingDriveRestore] = useState<string | null>(null);

  const handleExportAll = async () => {
    try {
      const snapshot = BackupEngine.createSnapshot();
      await localFileProvider.createBackup(snapshot);
      setToastMessage("Data exported successfully");
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to export data");
    }
  };

  const handleResetAll = () => {
    // We could move reset logic to the engine, but keeping it simple for now
    useAssignmentStore.setState({ assignments: [] });
    useHabitStore.setState({ habits: [] });
    // Reset attendance
    import("../../features/attendance/repositories/zustand-store").then(({ attendanceStore }) => {
       attendanceStore.setState({
         semesters: {},
         subjects: {},
         timetableVersions: {},
         timetableSlots: {},
         calendarEvents: {},
         scheduleOverrides: {},
         attendanceRecords: {}
       });
    });
    // Add additional domains if needed, or stick to what was here previously
    setToastMessage("All data has been reset");
  };

  const handleImportSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImportFile(file);
    // Do not reset event.target.value yet, wait for confirm/cancel
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;

    // Reject files larger than 10MB as DoS protection
    if (pendingImportFile.size > 10 * 1024 * 1024) {
      setToastMessage("Import failed: File size exceeds maximum limit of 10MB.");
      setPendingImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const envelope = await localFileProvider.restoreBackup(pendingImportFile);
      if (!envelope) throw new Error("Could not read backup file.");

      const result = await BackupEngine.validateAndRestore(envelope);
      
      if (result.success) {
        if (result.importedCount > 0) {
          setToastMessage(`Data imported successfully! Restored ${result.importedCount} records.`);
        } else {
          setToastMessage("Import completed: No valid data records found in backup.");
        }
        if (result.skippedEntities > 0) {
          console.warn(`Skipped ${result.skippedEntities} malformed entities during restore.`);
        }
      } else {
        setToastMessage(`Failed to import data: ${result.errors[0]}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process backup file";
      setToastMessage(`Import error: ${errorMsg}`);
      console.error("Import error:", err);
    }

    setPendingImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelImport = () => {
    setPendingImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadDriveBackups = async () => {
    try {
      const backups = await googleDriveProvider.listBackups();
      setDriveBackups(backups);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectDrive = async () => {
    try {
      setIsLoadingDrive(true);
      await googleDriveProvider.connect();
      setIsDriveConnected(true);
      setToastMessage("Connected to Google Drive");
      loadDriveBackups();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to connect to Google Drive. Ensure VITE_GOOGLE_CLIENT_ID is set.");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    await googleDriveProvider.disconnect();
    setIsDriveConnected(false);
    setDriveBackups([]);
    setToastMessage("Disconnected from Google Drive");
  };

  const handleExportDrive = async () => {
    try {
      setIsLoadingDrive(true);
      const snapshot = BackupEngine.createSnapshot();
      await googleDriveProvider.createBackup(snapshot);
      setToastMessage("Data exported to Google Drive successfully");
      loadDriveBackups();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to export data to Google Drive");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const confirmDriveRestore = async () => {
    if (!pendingDriveRestore) return;
    try {
      setIsLoadingDrive(true);
      const envelope = await googleDriveProvider.restoreBackup(pendingDriveRestore);
      if (!envelope) throw new Error("Could not read backup file from Drive.");

      const result = await BackupEngine.validateAndRestore(envelope);
      
      if (result.success) {
        if (result.importedCount > 0) {
          setToastMessage(`Data imported from Drive! Restored ${result.importedCount} records.`);
        } else {
          setToastMessage("Import completed: No valid data records found.");
        }
        if (result.skippedEntities > 0) {
          console.warn(`Skipped ${result.skippedEntities} malformed entities during restore.`);
        }
      } else {
        setToastMessage(`Failed to import data: ${result.errors[0]}`);
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to restore backup from Drive");
      console.error("Drive import error:", err);
    } finally {
      setIsLoadingDrive(false);
      setPendingDriveRestore(null);
    }
  };

  const cancelDriveRestore = () => {
    setPendingDriveRestore(null);
  };

  return (
    <Container>
      <PageHeader
        title="Settings"
        description="Configure your application preferences and local data."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl pb-12">
        <div className="lg:col-span-7 flex flex-col gap-6">
        <SettingsSection title="Appearance">
          <SettingsCard>
            <SelectRow
              label="Theme"
              description="Choose your preferred color theme."
              value={appSettings.theme}
              onChange={(v) => updateApp({ theme: v as "light" | "dark" | "system" })}
              options={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "System", value: "system" },
              ]}
            />
            <ToggleRow
              label="Compact Mode"
              description="Reduce spacing in cards and lists to see more items."
              checked={appSettings.compactMode}
              onChange={(v) => updateApp({ compactMode: v })}
            />
            <ToggleRow
              label="Animations"
              description="Enable subtle transitions and micro-animations."
              checked={appSettings.animationsEnabled}
              onChange={(v) => updateApp({ animationsEnabled: v })}
            />
          </SettingsCard>
        </SettingsSection>


        {/* Data Management */}
        <SettingsSection title="Data & Storage" description="Export backup or restore your local data.">
          <SettingsCard>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Export All Data</span>
                <span className="text-xs text-muted-foreground mt-0.5">Download a backup of all modules.</span>
              </div>
              <button
                onClick={handleExportAll}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
              >
                Export JSON
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">Import Data</span>
                <span className="text-xs text-muted-foreground mt-0.5">Restore a backup of all modules.</span>
              </div>
              <label className="text-sm font-medium text-foreground hover:text-primary cursor-pointer focus:outline-none transition-colors border border-border bg-background px-3 py-1.5 rounded-md">
                Import JSON
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportSelect}
                />
              </label>
            </div>
            {pendingImportFile && (
              <div className="px-4 py-3 bg-destructive/10 border-t border-destructive/20 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1 text-destructive font-medium">
                    Warning: Importing will overwrite your current assignments, habits, and attendance data.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={cancelImport} className="text-foreground hover:bg-muted">Cancel</Button>
                    <Button variant="primary" size="sm" onClick={confirmImport} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Overwrite</Button>
                  </div>
                </div>
              </div>
            )}
          </SettingsCard>

          <div className="mt-4">
            <SettingsCard>
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Google Drive Backup</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Securely store your backups in the cloud.</p>
            </div>
            {!isDriveConnected ? (
              <div className="px-4 py-4 flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground text-center">Connect your Google account to enable cloud backups. Only the StudentOS backup folder will be accessed.</p>
                <Button variant="primary" onClick={handleConnectDrive} disabled={isLoadingDrive}>
                  {isLoadingDrive ? "Connecting..." : "Connect to Google Drive"}
                </Button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Connected
                  </span>
                  <button onClick={handleDisconnectDrive} className="text-xs text-muted-foreground hover:text-foreground">Disconnect</button>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Create Backup</span>
                  <Button variant="secondary" size="sm" onClick={handleExportDrive} disabled={isLoadingDrive}>
                    {isLoadingDrive ? "Uploading..." : "Backup Now"}
                  </Button>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Available Backups</span>
                  {driveBackups.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No backups found in Google Drive.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {driveBackups.map(backup => (
                        <div key={backup.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium truncate max-w-[150px] sm:max-w-xs">{backup.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(backup.createdTime).toLocaleString()} &bull; {Math.round(parseInt(backup.size) / 1024)} KB
                            </span>
                          </div>
                          <Button variant="secondary" size="sm" onClick={() => setPendingDriveRestore(backup.id)} disabled={isLoadingDrive} className="h-7 text-xs">
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {pendingDriveRestore && (
              <div className="px-4 py-3 bg-destructive/10 border-t border-destructive/20 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1 text-destructive font-medium">
                    Warning: Restoring from Google Drive will overwrite your current assignments, habits, and attendance data.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={cancelDriveRestore} className="text-foreground hover:bg-muted" disabled={isLoadingDrive}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={confirmDriveRestore} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoadingDrive}>
                      {isLoadingDrive ? "Restoring..." : "Overwrite"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </SettingsCard>
          </div>
          
          <div className="mt-4">
            <DangerZone
              title="Reset All Data"
              description="This will permanently delete all attendance, assignments, habits, and pomodoro history. Settings will remain."
              buttonText="Reset All Modules"
              onConfirm={handleResetAll}
            />
          </div>
        </SettingsSection>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
        {/* About */}
        <SettingsSection title="About">
          <SettingsCard>
            <div className="px-4 py-4 flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">StudentOS</span>
              <span className="text-xs text-muted-foreground">Version 2.0.0 (Local First Beta)</span>
              <span className="text-xs text-muted-foreground mt-2">
                Built with React, Tailwind CSS, Zustand, and TypeScript. All your data is stored locally on your device.
              </span>
            </div>
          </SettingsCard>
        </SettingsSection>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Container>
  );
}

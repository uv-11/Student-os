import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAttendanceCommands, useAttendanceData } from '../application/hooks';

export function SubjectSetup({ onComplete, onBack }: { onComplete: () => void, onBack: () => void }) {
    const { addSubject, updateSubject, removeSubject } = useAttendanceCommands();
    const { subjects } = useAttendanceData();
    
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [color, setColor] = useState('#3b82f6');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCode, setEditCode] = useState('');
    const [editColor, setEditColor] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanName = name.trim();
        const cleanCode = code.trim().toUpperCase();

        if (!cleanName) {
            setError('Subject name is required.');
            return;
        }
        if (!cleanCode) {
            setError('Subject code is required.');
            return;
        }

        const isDuplicateName = subjects.some(s => s.name.toLowerCase() === cleanName.toLowerCase());
        if (isDuplicateName) {
            setError('A subject with this name already exists.');
            return;
        }

        const isDuplicateCode = subjects.some(s => s.code.toLowerCase() === cleanCode.toLowerCase());
        if (isDuplicateCode) {
            setError('A subject with this code already exists.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addSubject(cleanName, cleanCode, color);
            setName('');
            setCode('');
            showSuccess(`Subject "${cleanName}" added!`);
        } catch (err) {
            console.error(err);
            setError('Failed to add subject.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStartEdit = (sub: any) => {
        setEditingId(sub.id);
        setEditName(sub.name);
        setEditCode(sub.code);
        setEditColor(sub.color);
        setError('');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        const cleanName = editName.trim();
        const cleanCode = editCode.trim().toUpperCase();

        if (!cleanName || !cleanCode) {
            setError('Name and Code cannot be empty.');
            return;
        }

        const sub = subjects.find(s => s.id === editingId);
        if (sub) {
            setIsSubmitting(true);
            try {
                await updateSubject({
                    ...sub,
                    name: cleanName,
                    code: cleanCode,
                    color: editColor
                });
                showSuccess('Subject updated!');
                setEditingId(null);
            } catch (err) {
                console.error(err);
                setError('Failed to update subject.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleRemove = async (id: string) => {
        const sub = subjects.find(s => s.id === id);
        setIsSubmitting(true);
        try {
            await removeSubject(id);
            showSuccess(`Subject "${sub?.name || ''}" deleted.`);
            setConfirmDeleteId(null);
        } catch (err) {
            console.error(err);
            setError('Failed to remove subject.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Subjects</h2>
                    <p className="text-muted-foreground text-sm mt-1">Add the subjects you are taking this semester.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={onBack}>Back</Button>
                    <Button onClick={onComplete} disabled={subjects.length === 0}>
                        Continue
                    </Button>
                </div>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="mb-4 p-3 bg-success/10 border border-success/30 text-success text-sm font-medium rounded-lg flex items-center justify-between">
                    <span>✓ {successMessage}</span>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger text-sm font-medium rounded-lg">
                    ⚠️ {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-muted/30 border border-border p-4 rounded-xl">
                <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wider text-muted-foreground">Subject Name *</label>
                    <Input 
                        placeholder="e.g. Applied Physics" 
                        value={name} 
                        onChange={e => { setName(e.target.value); setError(''); }} 
                        required 
                    />
                </div>
                
                <div className="w-full md:w-32">
                    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wider text-muted-foreground">Code *</label>
                    <Input 
                        placeholder="PHY101" 
                        value={code} 
                        onChange={e => { setCode(e.target.value); setError(''); }} 
                        required 
                    />
                </div>

                <div className="w-full md:w-20">
                    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wider text-muted-foreground">Color</label>
                    <Input 
                        type="color" 
                        value={color} 
                        onChange={e => setColor(e.target.value)} 
                        className="h-10 p-1 w-full cursor-pointer"
                    />
                </div>

                <Button type="submit" variant="secondary" className="w-full md:w-auto h-10" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Subject'}
                </Button>
            </form>

            <div className="space-y-2">
                {subjects.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border border-border bg-card rounded-xl group hover:shadow-sm transition-all">
                        {editingId === sub.id ? (
                            <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                                <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1" placeholder="Name" />
                                <Input value={editCode} onChange={e => setEditCode(e.target.value)} className="w-24" placeholder="Code" />
                                <Input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-16 h-10 p-1 cursor-pointer" />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveEdit} disabled={isSubmitting}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                </div>
                            </div>
                        ) : confirmDeleteId === sub.id ? (
                            <div className="flex-1 flex items-center justify-between bg-danger/10 border border-danger/20 p-2 rounded-lg">
                                <span className="text-xs text-danger font-bold">Delete "{sub.name}"?</span>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="primary" className="bg-danger hover:bg-danger text-danger-foreground border-transparent" onClick={() => handleRemove(sub.id)} disabled={isSubmitting}>
                                        {isSubmitting ? 'Deleting...' : 'Confirm'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sub.color }} />
                                    <div>
                                        <div className="font-bold text-sm truncate">{sub.name}</div>
                                        <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{sub.code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(sub)}>Edit</Button>
                                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => setConfirmDeleteId(sub.id)}>Remove</Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {subjects.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2">
                        <p className="font-medium">No subjects added yet.</p>
                        <p className="text-xs">Add your first subject using the form above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


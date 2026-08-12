import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAttendanceCommands, useAttendanceData } from '../application/hooks';
import { toLocalDateString, parseLocalDate } from '../utils/date';

export function SemesterSetup({ onComplete }: { onComplete: () => void }) {
    const { createSemester, updateSemester } = useAttendanceCommands();
    const { activeSemester } = useAttendanceData();
    
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [targetPercentage, setTargetPercentage] = useState<number | ''>(75);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [prevSemester, setPrevSemester] = useState(activeSemester);
    if (activeSemester !== prevSemester) {
        setPrevSemester(activeSemester);
        if (activeSemester) {
            setName(activeSemester.name);
            setStartDate(toLocalDateString(activeSemester.startDate));
            setEndDate(toLocalDateString(activeSemester.endDate));
            setTargetPercentage(activeSemester.targetAttendancePercentage ?? 75);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const start = parseLocalDate(startDate);
        const end = parseLocalDate(endDate);

        if (start >= end) {
            setError('Start date must be before end date.');
            return;
        }

        const targetNum = Number(targetPercentage);
        if (isNaN(targetNum) || targetNum <= 0 || targetNum > 100) {
            setError('Target percentage must be greater than 0 and up to 100.');
            return;
        }

        setLoading(true);
        try {
            if (activeSemester) {
                await updateSemester({
                    ...activeSemester,
                    name,
                    startDate: start,
                    endDate: end,
                    targetAttendancePercentage: targetNum
                });
            } else {
                await createSemester(name, start, end, targetNum);
            }
            onComplete();
        } catch (err) {
            console.error(err);
            setError('An error occurred while saving the semester.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-card rounded-xl shadow-sm border border-border">
            <h2 className="text-xl font-bold tracking-tight mb-2">Welcome to Attendance</h2>
            <p className="text-muted-foreground mb-6 text-sm">Let's start by setting up your current semester.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Semester Name</label>
                    <Input 
                        placeholder="e.g. Fall 2026" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <Input 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <Input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            required 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Target Attendance (%)</label>
                    <Input 
                        type="number" 
                        placeholder="75" 
                        value={targetPercentage} 
                        onChange={e => setTargetPercentage(e.target.value ? Number(e.target.value) : '')} 
                        required 
                        min="1"
                        max="100"
                    />
                </div>

                {error && (
                    <div className="text-danger text-sm font-medium mt-2">{error}</div>
                )}

                <div className="flex items-center gap-4 mt-2">
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Saving...' : activeSemester ? 'Continue' : 'Create Semester'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

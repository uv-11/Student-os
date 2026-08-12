import { useState } from "react";
import { X, Calendar as CalendarIcon, AlignLeft, PaintBucket } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { useCalendarStore, type StandaloneCalendarEvent } from "../../store/calendarStore";
import { dateInputToTimestamp, timestampToDateInput } from "../../utils/assignments";

interface EventFormProps {
  initialData?: StandaloneCalendarEvent;
  onClose: () => void;
  selectedDate?: Date;
}

export function EventForm({ initialData, onClose, selectedDate }: EventFormProps) {
  const { addEvent, updateEvent } = useCalendarStore();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(() => 
    initialData?.date 
      ? timestampToDateInput(initialData.date) 
      : (selectedDate ? timestampToDateInput(selectedDate.getTime()) : timestampToDateInput(Date.now()))
  );
  const [color, setColor] = useState(initialData?.color || "blue");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const eventDate = dateInputToTimestamp(date);
    if (!eventDate) return;

    if (initialData) {
      updateEvent(initialData.id, {
        title,
        description,
        date: eventDate,
        color,
      });
    } else {
      addEvent({
        title,
        description,
        date: eventDate,
        type: "custom",
        color,
      });
    }
    onClose();
  };

  const colors = ["blue", "indigo", "emerald", "violet", "rose", "amber"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{initialData ? "Edit Event" : "New Event"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium text-lg border-none bg-transparent px-0 focus-visible:ring-0"
              required
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 w-full max-w-[200px]"
                required
              />
            </div>

            <div className="flex items-start gap-3 text-sm">
              <AlignLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                className="resize-none min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-3 text-sm">
              <PaintBucket className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      color === c
                        ? "border-primary scale-110 shadow-sm"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: `var(--color-${c}-500, ${c})` }} // Fallback if css var is missing, but Tailwind colors should be mapped if you use raw bg-classes instead
                  >
                     <span className={`block w-full h-full rounded-full bg-${c}-500`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-4">
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => { useCalendarStore.getState().deleteEvent(initialData.id); onClose(); }} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Delete
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || !date}>
                {initialData ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

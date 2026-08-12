import { useState, useMemo } from "react";
import { Plus, Activity, SearchX } from "lucide-react";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { HabitCard } from "../../components/habits/HabitCard";
import { HabitForm } from "../../components/habits/HabitForm";
import { HabitsToolbar, type HabitFilter } from "../../components/habits/HabitsToolbar";
import { useHabitStore } from "../../store/habitStore";
import {
  isCompletedToday,
  isCompletedYesterday,
  sortHabits,
  type HabitSortOption,
} from "../../utils/habits";
import type { Habit } from "../../types/habit";

export default function HabitsPage() {
  const { habits, deleteHabit, restoreHabit } = useHabitStore();

  const [isAdding, setIsAdding] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "add";
  });
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<HabitFilter>("ALL");
  const [sortBy, setSortBy] = useState<HabitSortOption>("createdAt");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Habit | null>(null);

  const handleEdit = (habit: Habit) => {
    setIsAdding(false);
    setEditingHabit(habit);
  };

  const handleCloseForm = () => {
    if (isAdding) {
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url);
    }
    setIsAdding(false);
    setEditingHabit(null);
  };

  const handleDelete = (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (target) {
      setLastDeleted(target);
      deleteHabit(habitId);
      setToastMessage(`Deleted "${target.name}"`);
    }
  };

  const handleUndo = () => {
    if (lastDeleted) {
      restoreHabit(lastDeleted);
      setLastDeleted(null);
      setToastMessage(null);
    }
  };

  const filtered = useMemo(() => {
    let result = habits;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(q));
    }

    if (filter === "COMPLETED_TODAY") {
      result = result.filter((h) => isCompletedToday(h.completionLog));
    } else if (filter === "NOT_COMPLETED") {
      result = result.filter((h) => !isCompletedToday(h.completionLog));
    } else if (filter === "ACTIVE") {
      // Active = completed at least once in the last 7 days
      result = result.filter(
        (h) => isCompletedToday(h.completionLog) || isCompletedYesterday(h.completionLog) || h.completionLog.length > 0
      );
    }

    return sortHabits(result, sortBy);
  }, [habits, searchQuery, filter, sortBy]);

  const isFiltering = searchQuery.trim() !== "" || filter !== "ALL";

  const totalHabits = habits.length;
  const completedToday = habits.filter(h => isCompletedToday(h.completionLog)).length;
  const progressPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <Container>
      <PageHeader
        title="Habits"
        description="Build consistency with daily tracking and streaks."
        actions={
          !isAdding && !editingHabit && (
            <Button onClick={() => setIsAdding(true)} className="hidden md:flex">
              <Plus className="h-4 w-4 mr-2" /> Add Habit
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-6 pb-24 md:pb-12">
        {totalHabits > 0 && !isAdding && !editingHabit && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">Today's Progress</span>
              <span className="text-muted-foreground font-semibold tracking-tight">{completedToday} / {totalHabits} completed ({progressPct}%)</span>
            </div>
            <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border/50">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {habits.length > 0 && !isAdding && !editingHabit && (
          <HabitsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {isAdding && <HabitForm onClose={handleCloseForm} />}
        {editingHabit && <HabitForm initialData={editingHabit} onClose={handleCloseForm} />}

        {/* Global empty state */}
        {habits.length === 0 && !isAdding && !editingHabit && (
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="No habits yet"
            description="Add your first habit to start building a streak and tracking your consistency."
            action={<Button onClick={() => setIsAdding(true)}>Add Habit</Button>}
          />
        )}

        {/* Filtered empty state */}
        {habits.length > 0 && filtered.length === 0 && !isAdding && !editingHabit && (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No habits match"
            description={
              isFiltering
                ? "Try adjusting your search or filter."
                : "All habits are completed today! Great work."
            }
            action={
              isFiltering ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Habit grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((habit) =>
              editingHabit?.id === habit.id ? null : (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onEdit={handleEdit}
                  onDeleteOverride={() => handleDelete(habit.id)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!isAdding && !editingHabit && (
        <Button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden flex items-center justify-center p-0 z-40"
          aria-label="Add Habit"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Undo toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onUndo={lastDeleted ? handleUndo : undefined}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Container>
  );
}

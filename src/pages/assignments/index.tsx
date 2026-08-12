import { useState, useMemo } from "react";
import { Plus, FileText, SearchX } from "lucide-react";
import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { AssignmentCard } from "../../components/assignments/AssignmentCard";
import { AssignmentForm } from "../../components/assignments/AssignmentForm";
import { AssignmentsToolbar, type StatusFilter, type PriorityFilter } from "../../components/assignments/AssignmentsToolbar";
import { useAssignmentStore } from "../../store/assignmentStore";
import { AssignmentStatus } from "../../types/assignmentStatus";
import { sortAssignments, type AssignmentSortOption } from "../../utils/assignments";
import type { Assignment } from "../../types/assignment";

export default function AssignmentsPage() {
  const { assignments, deleteAssignment, restoreAssignment } = useAssignmentStore();

  const [isAdding, setIsAdding] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "add";
  });
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Clear query param when closing form so it doesn't reopen on refresh
  const handleCloseForm = () => {
    if (isAdding) {
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url);
    }
    setIsAdding(false);
    setEditingAssignment(null);
  };

  // Toolbar state — default to "ACTIVE" so Done items are hidden initially
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortBy, setSortBy] = useState<AssignmentSortOption>("dueDate");

  // Undo state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Assignment | null>(null);

  const handleEdit = (assignment: Assignment) => {
    setIsAdding(false);
    setEditingAssignment(assignment);
  };

  // handleCloseForm moved above

  const handleDelete = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (target) {
      setLastDeleted(target);
      deleteAssignment(assignmentId);
      setToastMessage(`Deleted "${target.title}"`);
    }
  };

  const handleUndo = () => {
    if (lastDeleted) {
      restoreAssignment(lastDeleted);
      setLastDeleted(null);
      setToastMessage(null);
    }
  };

  const filtered = useMemo(() => {
    let result = assignments;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.subjectName?.toLowerCase().includes(q) ?? false)
      );
    }

    // Status filter
    if (statusFilter === "ACTIVE") {
      result = result.filter((a) => a.status !== AssignmentStatus.DONE);
    } else if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "ALL") {
      result = result.filter((a) => a.priority === priorityFilter);
    }

    return sortAssignments(result, sortBy);
  }, [assignments, searchQuery, statusFilter, priorityFilter, sortBy]);

  const isFiltering =
    searchQuery.trim() !== "" ||
    statusFilter !== "ACTIVE" ||
    priorityFilter !== "ALL";

  return (
    <Container>
      <PageHeader
        title="Assignments"
        description="Manage your tasks, projects, and deadlines."
        actions={
          !isAdding && !editingAssignment && (
            <Button onClick={() => setIsAdding(true)} className="hidden md:flex">
              <Plus className="h-4 w-4 mr-2" /> Add Assignment
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-6 pb-24 md:pb-12">
        {assignments.length > 0 && !isAdding && !editingAssignment && (
          <AssignmentsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {isAdding && <AssignmentForm onClose={handleCloseForm} />}
        {editingAssignment && (
          <AssignmentForm initialData={editingAssignment} onClose={handleCloseForm} />
        )}

        {/* Empty: no assignments at all */}
        {assignments.length === 0 && !isAdding && !editingAssignment && (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No assignments yet"
            description="Add your first assignment to start tracking your work and deadlines."
            action={<Button onClick={() => setIsAdding(true)}>Add Assignment</Button>}
          />
        )}

        {/* Empty: filter / search yields nothing */}
        {assignments.length > 0 && filtered.length === 0 && !isAdding && !editingAssignment && (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No assignments match"
            description={
              isFiltering
                ? "Try adjusting your search or filter settings."
                : "All done! No active assignments."
            }
            action={
              isFiltering ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ACTIVE");
                    setPriorityFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Assignment list */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((assignment) =>
              editingAssignment?.id === assignment.id ? null : (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onEdit={handleEdit}
                  onDeleteOverride={() => handleDelete(assignment.id)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!isAdding && !editingAssignment && (
        <Button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden flex items-center justify-center p-0 z-40"
          aria-label="Add Assignment"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Toast for undo */}
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

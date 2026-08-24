import { useNavigate } from "react-router-dom";
import { DashboardCard } from "./DashboardCard";
import { APP_ROUTES } from "../../config/routes";
import { AlertTriangle, Activity } from "lucide-react";
import { useCourseStore } from "../../store/courseStore";
import { useCourseHealth } from "../../features/academic-context/hooks/useCourseHealth";

function CourseHealthItem({ courseId, courseName }: { courseId: string; courseName: string }) {
  const navigate = useNavigate();
  const health = useCourseHealth(courseId);

  if (health.status === "Good" || health.status === "Neutral") {
    return null;
  }

  return (
    <li
      className="flex flex-col gap-2 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate(APP_ROUTES.COURSES)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(APP_ROUTES.COURSES)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 pr-2 overflow-hidden">
          {health.status === "Critical" ? (
             <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
          ) : (
             <Activity className="h-4 w-4 text-warning shrink-0" />
          )}
          <p className="text-sm font-semibold text-foreground truncate">
            {courseName}
          </p>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded shrink-0 ${
          health.status === "Critical" ? "text-danger bg-danger/10" : "text-warning bg-warning/10"
        }`}>
          {health.status}
        </span>
      </div>
      <div className="flex flex-col gap-1">
         {health.reasons.map((r, i) => (
           <p key={i} className="text-xs text-muted-foreground">• {r}</p>
         ))}
      </div>
    </li>
  );
}

export function WarningSubjectsCard() {
  const { courses } = useCourseStore();

  if (courses.length === 0) return null;

  return (
    <DashboardCard title="Course Health Warnings">
      <ul className="divide-y divide-border">
        {courses.map(course => (
          <CourseHealthItem key={course.id} courseId={course.id} courseName={course.name} />
        ))}
      </ul>
    </DashboardCard>
  )
}

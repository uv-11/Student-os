import { AlertTriangle, CheckCircle, Clock, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { usePriorityEngine } from "../../../features/academic-context/hooks/usePriorityEngine";
import type { PriorityItem } from "../../../features/academic-context/hooks/usePriorityEngine";
import { Card } from "../../ui/Card";
import { Link } from "react-router-dom";

export function PriorityWidget() {
  const priorities = usePriorityEngine();
  
  if (priorities.length === 0) {
    return (
      <Card className="flex flex-col p-5 bg-card/50">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-muted-foreground">
          <CheckCircle className="w-5 h-5 text-success" />
          All Caught Up
        </h3>
        <p className="text-sm text-muted-foreground">You have no urgent priorities at the moment. Good job!</p>
      </Card>
    );
  }

  // Take top 3 priorities
  const topPriorities = priorities.slice(0, 3);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH": return "text-destructive border-destructive/20 bg-destructive/10";
      case "MEDIUM": return "text-warning border-warning/20 bg-warning/10";
      case "LOW": return "text-info border-info/20 bg-info/10";
      default: return "text-muted-foreground border-border bg-accent";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "HIGH": return <AlertTriangle className="w-4 h-4" />;
      case "MEDIUM": return <Clock className="w-4 h-4" />;
      case "LOW": return <Calendar className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          What Matters Now
        </h3>
        <span className="text-xs font-semibold px-2 py-1 bg-accent rounded-full text-muted-foreground">
          {priorities.length} {priorities.length === 1 ? 'Action' : 'Actions'}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {topPriorities.map((p: PriorityItem) => (
          <Link 
            key={p.id} 
            to={p.actionDestination || "#"}
            className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
          >
            <div className="flex flex-col gap-1 pr-4">
              <span className="text-sm font-semibold">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.reason}</span>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getUrgencyColor(p.urgency)}`}>
                {getUrgencyIcon(p.urgency)}
                <span>{p.urgency}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

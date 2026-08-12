import { Container } from "../../components/ui/Container";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyStateStory } from "../../components/analytics/EmptyStateStory";
import { useAttendanceAnalytics } from "../../hooks/analytics/useAttendanceAnalytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export default function AnalyticsAttendancePage() {
  const analytics = useAttendanceAnalytics();

  if (!analytics) {
    return (
      <Container>
        <PageHeader title="Attendance Insights" description="Understand your class consistency." />
        <EmptyStateStory title="No attendance data yet." />
      </Container>
    );
  }

  const { overallPercentage, totalClasses, bestSubjects, riskSubjects, chartData } = analytics;

  // Pie chart for Safe vs Risk vs Other
  const safeCount = bestSubjects.length;
  const riskCount = riskSubjects.length;
  const totalCount = chartData.length;
  const otherCount = totalCount - safeCount - riskCount;

  const pieData = [
    { name: "Safe", value: safeCount, color: "#10b981" },
    { name: "At Risk", value: riskCount, color: "#f43f5e" },
  ];
  if (otherCount > 0) {
    pieData.push({ name: "On Track", value: otherCount, color: "#f59e0b" });
  }

  return (
    <Container>
      <PageHeader title="Attendance Insights" description="Understand your class consistency." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Overall Attendance" value={`${Math.round(overallPercentage)}%`} />
        <StatCard title="Total Classes" value={totalClasses.toString()} />
        <StatCard title="Best Subject" value={bestSubjects[0]?.name || "—"} />
        <StatCard title="At Risk" value={riskSubjects.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 border rounded-xl bg-card border-border/50">
          <h3 className="text-sm font-semibold mb-6">Subject Consistency</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card border-border/50 flex flex-col">
          <h3 className="text-sm font-semibold mb-6">Status Overview</h3>
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs text-muted-foreground">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

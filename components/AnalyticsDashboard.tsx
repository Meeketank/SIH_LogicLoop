import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Issue } from "./IssueCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface AnalyticsDashboardProps {
  issues: Issue[];
}

export function AnalyticsDashboard({ issues }: AnalyticsDashboardProps) {
  // Calculate analytics
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
  const inProgressIssues = issues.filter(i => i.status === 'in-progress').length;
  const reportedIssues = issues.filter(i => i.status === 'reported').length;
  const acknowledgedIssues = issues.filter(i => i.status === 'acknowledged').length;

  const resolutionRate = totalIssues ? (resolvedIssues / totalIssues) * 100 : 0;

  // Calculate average response time (mock data)
  const avgResponseTime = 2.4; // hours

  // Category breakdown
  const categoryData = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    category,
    count
  }));

  // Status distribution
  const statusData = [
    { name: 'Reported', value: reportedIssues, color: '#ef4444' },
    { name: 'Acknowledged', value: acknowledgedIssues, color: '#3b82f6' },
    { name: 'In Progress', value: inProgressIssues, color: '#f59e0b' },
    { name: 'Resolved', value: resolvedIssues, color: '#10b981' }
  ];

  // Trend data (mock - showing last 7 days)
  const trendData = [
    { day: 'Mon', reported: 12, resolved: 8 },
    { day: 'Tue', reported: 15, resolved: 10 },
    { day: 'Wed', reported: 8, resolved: 12 },
    { day: 'Thu', reported: 18, resolved: 14 },
    { day: 'Fri', reported: 22, resolved: 16 },
    { day: 'Sat', reported: 9, resolved: 15 },
    { day: 'Sun', reported: 6, resolved: 11 }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate.toFixed(1)}%</div>
            <Progress value={resolutionRate} className="mt-2" />
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}h</div>
            <p className="text-xs text-muted-foreground">
              -0.5h from last week
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Issues</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressIssues + acknowledgedIssues}</div>
            <p className="text-xs text-muted-foreground">
              {reportedIssues} new reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2">
                {statusData.map((status) => (
                  <Badge key={status.name} variant="outline" className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}: {status.value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Weekly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="reported" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Reported"
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
    </div>
  );
}
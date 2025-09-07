import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { IssueCard, Issue } from "./IssueCard";
import { IssueReportForm } from "./IssueReportForm";
import { IssueDetailsModal } from "./IssueDetailsModal";
import { UserProfile } from "../services/auth";
import { Plus, Search, Filter, Bell, BellOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationSupported,
  setNotificationPreference,
  getNotificationPreference 
} from "../services/notifications";
import { Alert, AlertDescription } from "./ui/alert";

interface CitizenAppProps {
  issues: Issue[];
  currentUser: UserProfile;
}

export function CitizenApp({ issues, currentUser }: CitizenAppProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  // Filter user's issues based on their email
  const userIssues = issues.filter(issue => 
    issue.reportedBy === currentUser.email || issue.reportedBy === 'You'
  );

  // Filter issues based on search and filters
  const filteredIssues = userIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleReportSubmit = () => {
    setShowReportForm(false);
  };

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleIssueUpdate = (issueId: string, updates: Partial<Issue>) => {
    // Update issue in the global state - this would typically be handled by parent component
    console.log('Issue updated:', issueId, updates);
  };

  const categories = [...new Set(issues.map(i => i.category).filter(cat => cat && cat.trim()))];

  // Check notification permission on load
  useEffect(() => {
    const checkNotifications = () => {
      if (isNotificationSupported()) {
        const permission = getNotificationPermission();
        const preference = getNotificationPreference();
        setNotificationsEnabled(permission === 'granted' && preference);
        
        // Show alert if notifications are not enabled but user hasn't been asked
        if (permission === 'default' && !preference) {
          setShowNotificationAlert(true);
        }
      }
    };
    
    checkNotifications();
  }, []);

  const handleNotificationRequest = async () => {
    const result = await requestNotificationPermission();
    
    if (result.granted) {
      setNotificationsEnabled(true);
      setNotificationPreference(true);
      setShowNotificationAlert(false);
    } else {
      setNotificationsEnabled(false);
      setNotificationPreference(false);
      if (result.error) {
        alert(result.error);
      }
      setShowNotificationAlert(false);
    }
  };

  const handleNotificationDismiss = () => {
    setNotificationPreference(false);
    setShowNotificationAlert(false);
  };

  if (showReportForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowReportForm(false)}
              className="mb-4"
            >
              ← Back to My Issues
            </Button>
          </div>
          <IssueReportForm
            currentUser={currentUser}
            onCancel={() => setShowReportForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">VJ</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Vikasit Jharkhand</h1>
                <p className="text-xs text-cyan-100">विकसित झारखंड</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={handleNotificationRequest}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 mr-2" />
              ) : (
                <BellOff className="h-4 w-4 mr-2" />
              )}
              {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-cyan-100">Report and track civic issues in your community</p>
            <p className="text-xs text-cyan-200">अपने समुदाय की समस्याओं को रिपोर्ट करें और ट्रैक करें</p>
          </div>
        </div>
      </div>

      {/* Notification Alert */}
      {showNotificationAlert && (
        <div className="max-w-4xl mx-auto p-4 pb-0">
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Enable notifications to get updates on your reported issues.</span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" onClick={handleNotificationRequest}>
                  Enable
                </Button>
                <Button size="sm" variant="outline" onClick={handleNotificationDismiss}>
                  Not Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Quick Stats */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-600">{userIssues.length}</div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {userIssues.filter(i => i.status === 'resolved').length}
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userIssues.filter(i => i.status === 'in-progress').length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userIssues.filter(i => i.status === 'acknowledged').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button 
            onClick={() => setShowReportForm(true)}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report New Issue
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Your Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <Input
                  placeholder="Search your reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Reports ({filteredIssues.length})</h2>
                <Badge variant="outline">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onSelect={handleIssueSelect}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  {userIssues.length === 0 ? (
                    <>
                      <p className="mb-4">You haven't reported any issues yet.</p>
                      <Button 
                        onClick={() => setShowReportForm(true)}
                        className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Report Your First Issue
                      </Button>
                    </>
                  ) : (
                    <p>No issues match your current filters.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        currentUser={currentUser}
        onIssueUpdate={handleIssueUpdate}
        isAdminView={false}
      />
    </div>
  );
}
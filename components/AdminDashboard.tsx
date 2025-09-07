import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { IssueCard, Issue } from "./IssueCard";
import { MapView } from "./MapView";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { IssueDetailsModal } from "./IssueDetailsModal";
import { VendorManagement } from "./VendorManagement";
import { SettingsModal } from "./SettingsModal";
import { UserProfile } from "../services/auth";
import { updateIssue } from "../services/issues";
import { subscribeToVendors, Vendor } from "../services/vendors";
import {
  Map,
  List,
  BarChart3,
  Search,
  Filter,
  UserPlus,
  Settings,
} from "lucide-react";

interface AdminDashboardProps {
  issues: Issue[];
  onUpdateIssue: (
    issueId: string,
    updates: Partial<Issue>,
  ) => void;
  currentUser: UserProfile;
}

const adminUsers: string[] = [];

export function AdminDashboard({
  issues,
  onUpdateIssue,
  currentUser,
}: AdminDashboardProps) {
  
  // Subscribe to vendors for proper name resolution
  useEffect(() => {
    const unsubscribe = subscribeToVendors((fetchedVendors) => {
      setVendors(fetchedVendors);
    });
    return () => unsubscribe();
  }, []);
  const [selectedIssue, setSelectedIssue] = useState<
    Issue | undefined
  >();
  const [showVendorManagement, setShowVendorManagement] = useState(false);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");

  // Filter issues based on search and filters
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      issue.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      issue.location.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || issue.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" ||
      issue.category === filterCategory;
    const matchesAssignee =
      filterAssignee === "all" ||
      (filterAssignee === "unassigned" && !issue.assignedTo) ||
      issue.assignedTo === filterAssignee;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesAssignee
    );
  });

  const categories = [
    ...new Set(
      issues
        .map((i) => i.category)
        .filter((cat) => cat && cat.trim()),
    ),
  ];
  const assignees = [
    ...new Set(issues.map((i) => i.assignedTo).filter(Boolean)),
  ];

  const handleStatusUpdate = async (
    issueId: string,
    newStatus: Issue["status"],
  ) => {
    try {
      await updateIssue(issueId, { status: newStatus });
      onUpdateIssue(issueId, { status: newStatus });
    } catch (error) {
      console.error("Failed to update issue status:", error);
    }
  };

  const handleAssignmentUpdate = async (
    issueId: string,
    assignee: string,
  ) => {
    try {
      await updateIssue(issueId, { assignedTo: assignee });
      onUpdateIssue(issueId, { assignedTo: assignee });
    } catch (error) {
      console.error("Failed to assign issue:", error);
    }
  };

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleAssignTask = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowVendorManagement(true);
  };

  const handleViewIssueDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowIssueDetails(true);
  };

  const handleAssignVendor = async (issueId: string, vendorId: string) => {
    try {
      // Find vendor name from the vendors list
      const vendor = vendors.find(v => v.id === vendorId);
      const vendorName = vendor ? vendor.name : `Vendor-${vendorId}`;
      
      await updateIssue(issueId, { 
        assignedTo: vendorName,
        status: 'in-progress'
      });
      onUpdateIssue(issueId, { 
        assignedTo: vendorName,
        status: 'in-progress'
      });
    } catch (error) {
      console.error("Failed to assign vendor:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-700 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  VJ
                </span>
              </div>
              <div>
                <h1 className="font-bold">
                  Vikasit Jharkhand Admin
                </h1>
                <p className="text-cyan-100">
                  विकसित झारखंड प्रशासन
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
          <div>
            <p className="text-cyan-100">
              Manage civic issues and coordinate responses
            </p>
            <p className="text-cyan-200">
              नागरिक मुद्दों का प्रबंधन और समन्वित प्रतिक्रिया
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold text-red-600 mb-2">
                {
                  issues.filter((i) => i.status === "reported")
                    .length
                }
              </div>
              <p className="text-muted-foreground">
                New Reports
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold text-yellow-600 mb-2">
                {
                  issues.filter(
                    (i) => i.status === "in-progress",
                  ).length
                }
              </div>
              <p className="text-muted-foreground">
                In Progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold text-blue-600 mb-2">
                {issues.filter((i) => !i.assignedTo).length}
              </div>
              <p className="text-muted-foreground">
                Unassigned
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold text-green-600 mb-2">
                {
                  issues.filter((i) => i.status === "resolved")
                    .length
                }
              </div>
              <p className="text-muted-foreground">
                Resolved Today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="map"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map View</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">
                Issue List
              </span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">
                Analytics
              </span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                  />
                </div>
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="min-w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Status
                    </SelectItem>
                    <SelectItem value="reported">
                      Reported
                    </SelectItem>
                    <SelectItem value="acknowledged">
                      Acknowledged
                    </SelectItem>
                    <SelectItem value="in-progress">
                      In Progress
                    </SelectItem>
                    <SelectItem value="resolved">
                      Resolved
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Categories
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category}
                        value={category}
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterAssignee}
                  onValueChange={setFilterAssignee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Assignees
                    </SelectItem>
                    <SelectItem value="unassigned">
                      Unassigned
                    </SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem
                        key={assignee}
                        value={assignee!}
                      >
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {filteredIssues.length} of {issues.length} issues
                </Badge>
                {(searchQuery ||
                  filterStatus !== "all" ||
                  filterCategory !== "all" ||
                  filterAssignee !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                      setFilterCategory("all");
                      setFilterAssignee("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <TabsContent value="map" className="space-y-4">
            <div className="h-[600px]">
              <MapView
                issues={filteredIssues}
                onIssueSelect={handleIssueSelect}
                selectedIssue={selectedIssue}
              />
            </div>

            {/* Selected Issue Panel */}
            {selectedIssue && (
              <Card>
                <CardHeader>
                  <CardTitle>Issue Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <IssueCard
                        issue={selectedIssue}
                        showAssignment={true}
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium mb-2">
                          Update Status
                        </label>
                        <Select
                          value={selectedIssue.status}
                          onValueChange={(value) =>
                            handleStatusUpdate(
                              selectedIssue.id,
                              value as Issue["status"],
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reported">
                              Reported
                            </SelectItem>
                            <SelectItem value="acknowledged">
                              Acknowledged
                            </SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="resolved">
                              Resolved
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block font-medium mb-2">
                          Assign Vendor
                        </label>
                        <Button
                          onClick={() => handleAssignTask(selectedIssue)}
                          className="w-full"
                          variant="outline"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="relative">
                  <IssueCard
                    issue={issue}
                    onSelect={() => handleViewIssueDetails(issue)}
                    showAssignment={true}
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Select
                      value={issue.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(
                          issue.id,
                          value as Issue["status"],
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-32 bg-white/95 backdrop-blur">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reported">
                          Reported
                        </SelectItem>
                        <SelectItem value="acknowledged">
                          Acknowledged
                        </SelectItem>
                        <SelectItem value="in-progress">
                          In Progress
                        </SelectItem>
                        <SelectItem value="resolved">
                          Resolved
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignTask(issue);
                      }}
                      className="h-8 w-32 bg-white/95 backdrop-blur"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard issues={issues} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={showIssueDetails}
        onClose={() => {
          setShowIssueDetails(false);
          setSelectedIssue(undefined);
        }}
        currentUser={currentUser}
        onIssueUpdate={(issueId, updates) => {
          onUpdateIssue(issueId, updates);
          setSelectedIssue(prev => prev ? { ...prev, ...updates } : prev);
        }}
        isAdminView={true}
      />

      {/* Vendor Management Modal */}
      <VendorManagement
        issue={selectedIssue}
        isOpen={showVendorManagement}
        onClose={() => {
          setShowVendorManagement(false);
          setSelectedIssue(undefined);
        }}
        onAssignVendor={handleAssignVendor}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
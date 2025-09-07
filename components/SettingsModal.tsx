import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Issue } from "./IssueCard";
import { UserProfile } from "../services/auth";
import {
  subscribeToIssues,
  updateIssue,
} from "../services/issues";
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Users,
  FileText,
  Trash2,
  Settings,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

interface CitizenData {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  lastActivity: Date;
  issues: Issue[];
}

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
}: SettingsModalProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [citizenData, setCitizenData] =
    useState<CitizenData | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingIssue, setEditingIssue] = useState<
    string | null
  >(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    status: "" as Issue["status"],
  });

  // Subscribe to all issues for admin management
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeToIssues((issues) => {
        setAllIssues(issues);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  const categories = [
    "Road/Sidewalk",
    "Street Lighting",
    "Waste Management",
    "Vandalism",
    "Parks/Recreation",
    "Public Safety",
    "Noise Complaint",
    "Water/Drainage",
    "Other",
  ];

  const handleSearchCitizen = () => {
    if (!searchEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!searchEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    // Find issues by this citizen
    const citizenIssues = allIssues.filter(
      (issue) =>
        issue.reportedBy.toLowerCase() ===
        searchEmail.toLowerCase(),
    );

    if (citizenIssues.length === 0) {
      setError("No reports found for this email address");
      setCitizenData(null);
      setLoading(false);
      return;
    }

    // Aggregate citizen data
    const totalReports = citizenIssues.length;
    const activeReports = citizenIssues.filter(
      (issue) => issue.status !== "resolved",
    ).length;
    const resolvedReports = citizenIssues.filter(
      (issue) => issue.status === "resolved",
    ).length;
    const lastActivity = new Date(
      // Math.max(...citizenIssues.map((issue) => issue.reportedAt.getTime()))
      Math.max(
        ...citizenIssues.map((issue) =>
          issue.reportedAt instanceof Date
            ? issue.reportedAt.getTime()
            : new Date(issue.reportedAt).getTime(),
        ),
      ),
    );

    setCitizenData({
      email: searchEmail,
      name: `User`, // In a real app, this would come from user profile
      phone: "Not available",
      address:
        citizenIssues[0]?.location.address || "Not available",
      totalReports,
      activeReports,
      resolvedReports,
      lastActivity,
      issues: citizenIssues.sort(
        (a, b) =>
          b.reportedAt.getTime() - a.reportedAt.getTime(),
      ),
    });

    setLoading(false);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue.id);
    setEditData({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
    });
    setError("");
  };

  const handleSaveEdit = async (issueId: string) => {
    if (
      !editData.title ||
      !editData.description ||
      !editData.category
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updates = {
        title: editData.title,
        description: editData.description,
        category: editData.category,
        status: editData.status,
      };

      await updateIssue(issueId, updates);

      // Update local citizen data
      if (citizenData) {
        setCitizenData({
          ...citizenData,
          issues: citizenData.issues.map((issue) =>
            issue.id === issueId
              ? { ...issue, ...updates }
              : issue,
          ),
        });
      }

      setEditingIssue(null);
    } catch (err: any) {
      console.error("Failed to update issue:", err);
      setError("Failed to update issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIssue(null);
    setError("");
  };

  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "reported":
        return "bg-red-100 text-red-700 border-red-200";
      case "acknowledged":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Settings & Citizen Management
          </DialogTitle>
          <DialogDescription>
            Search and manage citizen data, edit reports, and
            oversee platform activities
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="citizens" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="citizens"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Citizen Data
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              System Info
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Citizen by Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter citizen email address"
                      value={searchEmail}
                      onChange={(e) =>
                        setSearchEmail(e.target.value)
                      }
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        handleSearchCitizen()
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSearchCitizen}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {citizenData && (
              <>
                {/* Citizen Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle>Citizen Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Email
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {citizenData.email}
                          </p>
                        </div>
                      </div>
                      <br></br>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Total Reports
                          </p>
                          <p className="text-sm font-semibold text-cyan-600">
                            {citizenData.totalReports}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Last Activity
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {citizenData.lastActivity.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Status
                          </p>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Active User
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-2xl text-cyan-600 mb-1">
                        {citizenData.activeReports}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active Reports
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-2xl text-green-600 mb-1">
                        {citizenData.resolvedReports}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Resolved Reports
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-2xl text-blue-600 mb-1">
                        {Math.round(
                          (citizenData.resolvedReports /
                            citizenData.totalReports) *
                            100,
                        ) || 0}
                        %
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Resolution Rate
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Citizen's Issues */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Citizen's Reports (
                      {citizenData.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {citizenData.issues.map((issue) => (
                        <Card
                          key={issue.id}
                          className="border-l-4 border-l-cyan-500"
                        >
                          <CardContent className="p-4">
                            {editingIssue === issue.id ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Title</Label>
                                    <Input
                                      value={editData.title}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          title: e.target.value,
                                        })
                                      }
                                      placeholder="Issue title"
                                    />
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <select
                                      value={editData.category}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          category:
                                            e.target.value,
                                        })
                                      }
                                      className="w-full p-2 border rounded-md"
                                    >
                                      {categories.map((cat) => (
                                        <option
                                          key={cat}
                                          value={cat}
                                        >
                                          {cat}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editData.description}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        description:
                                          e.target.value,
                                      })
                                    }
                                    placeholder="Issue description"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <select
                                    value={editData.status}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        status: e.target
                                          .value as Issue["status"],
                                      })
                                    }
                                    className="w-full p-2 border rounded-md"
                                  >
                                    <option value="reported">
                                      Reported
                                    </option>
                                    <option value="acknowledged">
                                      Acknowledged
                                    </option>
                                    <option value="in-progress">
                                      In Progress
                                    </option>
                                    <option value="resolved">
                                      Resolved
                                    </option>
                                  </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveEdit(issue.id)
                                    }
                                    disabled={loading}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium">
                                      {issue.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {issue.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={getStatusColor(
                                        issue.status,
                                      )}
                                    >
                                      {issue.status}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleEditIssue(issue)
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {issue.location.address}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {issue.reportedAt.toLocaleDateString()}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="w-fit"
                                  >
                                    {issue.category}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">
                      Platform Stats
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Issues:
                        </span>
                        <span className="text-sm font-medium">
                          {allIssues.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Active Users:
                        </span>
                        <span className="text-sm font-medium">
                          {
                            new Set(
                              allIssues.map(
                                (i) => i.reportedBy,
                              ),
                            ).size
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Resolved Issues:
                        </span>
                        <span className="text-sm font-medium">
                          {
                            allIssues.filter(
                              (i) => i.status === "resolved",
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      Admin Info
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Current User:
                        </span>
                        <span className="text-sm font-medium">
                          {currentUser.name}
                        </span>
                        {/* email */}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Role:
                        </span>
                        <Badge variant="outline">
                          {currentUser.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Last Login:
                        </span>
                        <span className="text-sm font-medium">
                          Today
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-red-600 mb-1">
                        {
                          allIssues.filter(
                            (i) => i.status === "reported",
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        New Reports
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-yellow-600 mb-1">
                        {
                          allIssues.filter(
                            (i) => i.status === "in-progress",
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        In Progress
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-blue-600 mb-1">
                        {
                          allIssues.filter((i) => !i.assignedTo)
                            .length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Unassigned
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-green-600 mb-1">
                        {
                          allIssues.filter(
                            (i) => i.status === "resolved",
                          ).length
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Resolved
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
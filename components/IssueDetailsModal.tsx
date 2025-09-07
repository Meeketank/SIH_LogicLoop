import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Issue } from "./IssueCard";
import { UserProfile } from "../services/auth";
import { updateIssue } from "../services/issues";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  MapPin,
  Calendar,
  User,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface IssueDetailsModalProps {
  issue: Issue | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onIssueUpdate?: (
    issueId: string,
    updates: Partial<Issue>,
  ) => void;
  isAdminView?: boolean;
}

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

export function IssueDetailsModal({
  issue,
  isOpen,
  onClose,
  currentUser,
  onIssueUpdate,
  isAdminView = false,
}: IssueDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    location: { address: "", lat: 0, lng: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!issue) return null;

  const canEdit =
    !isAdminView &&
    (issue.reportedBy === currentUser.email ||
      issue.reportedBy === "You") &&
    (issue.status === "reported" ||
      issue.status === "acknowledged");

  const handleEditStart = () => {
    setEditData({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      location: issue.location,
    });
    setIsEditing(true);
    setError("");
  };

  const handleEditSave = async () => {
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
        location: editData.location,
      };

      await updateIssue(issue.id, updates);

      if (onIssueUpdate) {
        onIssueUpdate(issue.id, updates);
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update issue:", err);
      setError("Failed to update issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Issue title"
                    className="text-lg font-semibold"
                  />
                ) : (
                  <span className="break-words">
                    {issue.title}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={issue.status} />
                  {isEditing ? (
                    <Select
                      value={editData.category}
                      onValueChange={(value) =>
                        setEditData({
                          ...editData,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-cyan-50 text-cyan-700 border-cyan-200"
                    >
                      {issue.category}
                    </Badge>
                  )}
                </div>
              </DialogDescription>
            </div>
            {canEdit && !isEditing && (
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditStart}
                  className="ml-10 mt-3"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Section */}
          {issue.imageUrl ? (
            <Card>
              <CardContent className="p-4">
                <Label className="block mb-2 font-medium">
                  Photo Evidence
                </Label>
                <ImageWithFallback
                  src={issue.imageUrl}
                  alt="Issue photo"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <Label className="block mb-2 font-medium">
                  Photo Evidence
                </Label>
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {(issue as any).imageUploadFailed
                        ? "Image upload failed during submission"
                        : "No photo attached"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <Label className="block mb-2 font-medium">
                Description
              </Label>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Issue description"
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {issue.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-4">
              <Label className="block mb-2 font-medium">
                Location
              </Label>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                {isEditing ? (
                  <Input
                    value={editData.location.address}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        location: {
                          ...editData.location,
                          address: e.target.value,
                        },
                      })
                    }
                    placeholder="Location address"
                    className="flex-1"
                  />
                ) : (
                  <div>
                    <p>{issue.location.address}</p>
                    {issue.location.lat !== 0 &&
                      issue.location.lng !== 0 && (
                        <p className="text-sm text-muted-foreground">
                          Coordinates:{" "}
                          {issue.location.lat.toFixed(6)},{" "}
                          {issue.location.lng.toFixed(6)}
                        </p>
                      )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Issue Information */}
          <Card>
            <CardContent className="p-4">
              <Label className="block mb-3 font-medium">
                Issue Information
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Reported On
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {issue.reportedAt.toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/* Reported By row with fixed icon layout */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    {" "}
                    {/* Added min-w-0 to prevent overflow */}
                    <p className="text-sm font-medium">
                      Reported By
                    </p>
                    <div className="flex items-center gap-2 w-full">
                      <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                        {" "}
                        {/* Added flex-1 and min-w-0 */}
                        {issue.reportedBy}
                      </p>
                      {issue.reportedBy.includes("@") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={() =>
                            window.open(
                              `mailto:${issue.reportedBy}?subject=Regarding Issue: ${issue.title}&body=Dear Citizen,%0A%0AThis is regarding the civic issue you reported on ${issue.reportedAt.toLocaleDateString()}:%0A%0ATitle: ${issue.title}%0ACategory: ${issue.category}%0ALocation: ${issue.location.address}%0A%0ABest regards,%0AVikasit Jharkhand Admin Team`,
                            )
                          }
                          title="Send email to reporter"
                        >
                          <Mail className="h-3 w-3 text-cyan-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {issue.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Assigned To
                      </p>
                      <p className="text-sm text-cyan-600">
                        {issue.assignedTo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions for Admin View */}
          {isAdminView && (
            <Card>
              <CardContent className="p-4">
                <Label className="block mb-3 font-medium">
                  Admin Actions
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleEditCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
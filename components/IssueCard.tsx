import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { StatusBadge, IssueStatus } from "./StatusBadge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Calendar, User } from "lucide-react";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IssueStatus;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
}

interface IssueCardProps {
  issue: Issue;
  onSelect?: (issue: Issue) => void;
  showAssignment?: boolean;
}

export function IssueCard({ issue, onSelect, showAssignment = false }: IssueCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect?.(issue)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2">{issue.title}</CardTitle>
          <StatusBadge status={issue.status} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
            {issue.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {issue.imageUrl && (
          <div className="mb-3">
            <ImageWithFallback
              src={issue.imageUrl}
              alt="Issue photo"
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
        
        <p className="text-muted-foreground mb-3 line-clamp-2">
          {issue.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{issue.location.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{issue.reportedAt.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>By {issue.reportedBy}</span>
          </div>
          
          {showAssignment && issue.assignedTo && (
            <div className="flex items-center gap-2 text-sm text-cyan-600">
              <User className="h-4 w-4" />
              <span>Assigned to {issue.assignedTo}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
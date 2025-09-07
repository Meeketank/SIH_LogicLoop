import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Issue } from "./IssueCard";
import { MapPin, ZoomIn, ZoomOut, Layers } from "lucide-react";

interface MapViewProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  selectedIssue?: Issue;
}

export function MapView({ issues, onIssueSelect, selectedIssue }: MapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(12);
  const [viewMode, setViewMode] = useState<'street' | 'satellite'>('street');
  const [mapError, setMapError] = useState<string | null>(null);

  // Mock map center (in a real app, this would be based on city/user location)
  const mapCenter = { lat: 23.3441, lng: 85.3096 }; // Ranchi, Jharkhand

  // Filter issues with valid coordinates
  const validIssues = issues.filter(issue => {
    const hasValidCoords = issue.location.lat !== 0 && issue.location.lng !== 0;
    if (!hasValidCoords) {
      console.warn(`Issue ${issue.id} has invalid coordinates:`, issue.location);
    }
    return hasValidCoords;
  });

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full relative">
        {/* Error Message */}
        {mapError && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-red-600 mb-2">Map Error</p>
              <p className="text-sm text-muted-foreground">{mapError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMapError(null)}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* No Issues Message */}
        {!mapError && validIssues.length === 0 && (
          <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No issues with valid locations to display</p>
              <p className="text-sm text-muted-foreground">
                Issues need location coordinates to appear on the map
              </p>
            </div>
          </div>
        )}
        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 18))}
            className="bg-white shadow-md"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 1))}
            className="bg-white shadow-md"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'street' ? 'satellite' : 'street')}
            className="bg-white shadow-md"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Area */}
        <div 
          className={`w-full h-full rounded-lg relative ${
            viewMode === 'satellite' 
              ? 'bg-gradient-to-br from-green-100 to-blue-100' 
              : 'bg-gradient-to-br from-gray-100 to-blue-50'
          }`}
        >
          {/* Mock street pattern */}
          <div className="absolute inset-0">
            <svg className="w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6b7280" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Issue Markers */}
          {validIssues.map((issue, index) => {
            const x = (issue.location.lng - mapCenter.lng) * 1000 + 50 + (index % 5) * 80;
            const y = (mapCenter.lat - issue.location.lat) * 1000 + 50 + Math.floor(index / 5) * 60;
            
            return (
              <div
                key={issue.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 ${
                  selectedIssue?.id === issue.id ? 'scale-125 z-20' : 'z-10'
                }`}
                style={{ 
                  left: `${Math.max(10, Math.min(x, 90))}%`, 
                  top: `${Math.max(10, Math.min(y, 90))}%` 
                }}
                onClick={() => onIssueSelect(issue)}
              >
                <div className={`relative ${selectedIssue?.id === issue.id ? 'animate-pulse' : ''}`}>
                  <MapPin 
                    className={`h-8 w-8 ${
                      issue.status === 'resolved' ? 'text-green-600' :
                      issue.status === 'in-progress' ? 'text-yellow-600' :
                      issue.status === 'acknowledged' ? 'text-blue-600' :
                      'text-red-600'
                    } drop-shadow-md`}
                    fill="currentColor"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 px-1 py-0 text-xs bg-white border shadow-sm"
                  >
                    {issue.category.split('/')[0]}
                  </Badge>
                </div>
              </div>
            );
          })}

          {/* Selected Issue Popup */}
          {selectedIssue && (
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <Card className="shadow-lg border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold truncate mr-2">{selectedIssue.title}</h3>
                    <StatusBadge status={selectedIssue.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {selectedIssue.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{selectedIssue.location.address}</span>
                    <span>{selectedIssue.reportedAt.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span>Reported</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>Acknowledged</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-600" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>Resolved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
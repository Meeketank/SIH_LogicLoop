import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { UserProfile } from "../services/auth";
import { addIssue } from "../services/issues";
import { getUserLocation, requestLocationPermission } from "../services/location";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  storage,
  isFirebaseAvailable,
} from "../services/firebase";
import {
  Camera,
  MapPin,
  Mic,
  MicOff,
  Send,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface IssueReportFormProps {
  currentUser: UserProfile;
  onCancel: () => void;
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

export function IssueReportForm({
  currentUser,
  onCancel,
}: IssueReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioDescription, setAudioDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch live location when form opens
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Request permission first
        const permission = await requestLocationPermission();
        if (permission === 'denied') {
          setLocation("Location permission denied - Enter manually");
          setTimeout(() => {
            setError("Location access denied. Please enable location services in your browser settings or enter address manually.");
          }, 1000);
          return;
        }

        // Get current location
        const result = await getUserLocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        });

        if (result.error) {
          setLocation("Location unavailable - Enter manually");
          setTimeout(() => {
            setError(`Location error: ${result.error}. Please enter your address manually.`);
          }, 1000);
        } else {
          setLatLng({ lat: result.lat, lng: result.lng });
          setLocation(result.address);
          // Clear any previous errors
          setError("");
        }
      } catch (err) {
        console.error("Location fetch error:", err);
        setLocation("Enter manually");
        setTimeout(() => {
          setError("Unable to fetch location. Please enter manually or check your browser's location settings.");
        }, 1000);
      }
    };

    fetchLocation();
  }, []);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const imageRef = ref(
      storage,
      `issue-images/${Date.now()}_${file.name}`,
    );
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (isRecording)
      setAudioDescription("Voice note recorded successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload image if selected
      let finalImageUrl: string | undefined = undefined;
      let imageUploadFailed = false;
      
      if (selectedImage) {
        if (isFirebaseAvailable) {
          try {
            finalImageUrl = await Promise.race([
              uploadImage(selectedImage),
              new Promise<string>((_, reject) =>
                setTimeout(
                  () =>
                    reject(new Error("Image upload timeout")),
                  15000,
                ),
              ),
            ]);
          } catch (imgErr) {
            console.error("Image upload failed:", imgErr);
            imageUploadFailed = true;
            // Show warning but continue with submission
            setError("⚠️ Image upload failed, but your report will be submitted without the image. You can edit the report later to add the image.");
          }
        } else {
          finalImageUrl = imageUrl;
        }
      }

      // Check if we should continue submission
      if (imageUploadFailed && selectedImage) {
        const shouldContinue = confirm(
          "Image upload failed. Would you like to submit the report without the image? You can edit it later to add the image."
        );
        if (!shouldContinue) {
          setLoading(false);
          setError("Submission cancelled. Please try uploading the image again or submit without image.");
          return;
        }
      }

      // Prepare issue data
      const issueData: any = {
        title,
        description,
        category,
        location: {
          address: location,
          lat: latLng?.lat ?? 0,
          lng: latLng?.lng ?? 0,
        },
        reportedBy: currentUser.email,
        status: "reported",
      };

      if (finalImageUrl) {
        issueData.imageUrl = finalImageUrl;
      } else if (selectedImage && !finalImageUrl) {
        // Mark that image was attempted but failed
        issueData.imageUploadFailed = true;
      }
      
      if (audioDescription)
        issueData.audioDescription = audioDescription;

      console.log("Submitting issue:", issueData);
      await addIssue(issueData);
      console.log("✅ Issue submitted successfully");
      
      if (imageUploadFailed) {
        alert("✅ Report submitted successfully (without image). You can edit the report later to add the image.");
      }
      
      onCancel();
    } catch (err: any) {
      console.error("❌ Error submitting issue:", err);
      setError(
        err.message ||
          "Failed to submit issue. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report an Issue</CardTitle>
        <p className="text-sm text-muted-foreground">
          समस्या की रिपोर्ट करें
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed description of the issue"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Voice Description (Optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={
                  isRecording ? "destructive" : "outline"
                }
                size="sm"
                onClick={handleVoiceRecord}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isRecording
                  ? "Stop Recording"
                  : "Record Voice Note"}
              </Button>
              {audioDescription && (
                <span className="text-sm text-green-600">
                  {audioDescription}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Address or coordinates"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setError("");
                  try {
                    const result = await getUserLocation({
                      enableHighAccuracy: true,
                      timeout: 15000,
                    });
                    
                    if (result.error) {
                      setError(result.error);
                      setLocation("Enter manually");
                      setLatLng({ lat: 0, lng: 0 });
                    } else {
                      setLatLng({ lat: result.lat, lng: result.lng });
                      setLocation(result.address);
                    }
                  } catch (err) {
                    console.error("Location error:", err);
                    setError("Unable to get your location. Please try again or enter manually.");
                    setLocation("Enter manually");
                    setLatLng({ lat: 0, lng: 0 });
                  }
                }}
              >
                <MapPin className="h-4 w-4" /> Use Current
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Label
                  htmlFor="photo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer"
                >
                  <Camera className="h-4 w-4" /> Take/Upload
                  Photo
                </Label>
              </div>
              {imageUrl && (
                <ImageWithFallback
                  src={imageUrl}
                  alt="Issue photo"
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
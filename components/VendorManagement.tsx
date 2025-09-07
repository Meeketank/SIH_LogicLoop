import { useState, useEffect, useRef } from "react";
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
import { Issue } from "./IssueCard";
import { 
  Vendor,
  addVendor as addVendorToFirebase,
  updateVendor as updateVendorInFirebase,
  subscribeToVendors 
} from "../services/vendors";
import {
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  Star,
  Edit,
  Save,
  X,
} from "lucide-react";

interface VendorManagementProps {
  issue: Issue | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onAssignVendor?: (issueId: string, vendorId: string) => void;
}

export function VendorManagement({
  issue,
  isOpen,
  onClose,
  onAssignVendor,
}: VendorManagementProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    email: "",
    phone: "",
    specialities: "",
    location: "",
    description: "",
    baseQuote: "",
  });
  const [editVendor, setEditVendor] = useState({
    name: "",
    email: "",
    phone: "",
    specialities: "",
    location: "",
    description: "",
    baseQuote: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const addVendorRef = useRef<HTMLDivElement>(null);

  // Subscribe to vendors from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToVendors((fetchedVendors) => {
      setVendors(fetchedVendors);
    });
    return () => unsubscribe();
  }, []);

  // Handle click outside to close add vendor form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAddVendor && addVendorRef.current && !addVendorRef.current.contains(event.target as Node)) {
        setShowAddVendor(false);
        setError("");
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddVendor]);

  // Filter vendors by issue category
  const relevantVendors = vendors.filter(vendor => 
    !issue || vendor.specialities.length === 0 || vendor.specialities.includes(issue.category)
  );
  const displayVendors = relevantVendors.length > 0 ? relevantVendors : vendors;

  const handleAssignVendor = (vendorId: string) => {
    if (issue && onAssignVendor) {
      onAssignVendor(issue.id, vendorId);
      setSelectedVendor(vendorId);
      onClose();
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.name || !newVendor.email || !newVendor.phone || !newVendor.baseQuote) {
      setError("Please fill in all required fields including pricing");
      return;
    }

    const baseQuoteNum = parseFloat(newVendor.baseQuote);
    if (isNaN(baseQuoteNum) || baseQuoteNum <= 0) {
      setError("Please enter a valid base quote amount");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const vendorData = {
        name: newVendor.name,
        email: newVendor.email,
        phone: newVendor.phone,
        specialities: newVendor.specialities.split(",").map(s => s.trim()).filter(s => s),
        location: newVendor.location,
        rating: 0,
        totalJobs: 0,
        baseQuote: baseQuoteNum,
        description: newVendor.description,
        verified: false,
      };

      await addVendorToFirebase(vendorData);
      setShowAddVendor(false);
      setNewVendor({
        name: "",
        email: "",
        phone: "",
        specialities: "",
        location: "",
        description: "",
        baseQuote: "",
      });
    } catch (err: any) {
      console.error("Failed to add vendor:", err);
      setError("Failed to add vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor.id);
    setEditVendor({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      specialities: vendor.specialities.join(", "),
      location: vendor.location,
      description: vendor.description,
      baseQuote: vendor.baseQuote.toString(),
    });
    setError("");
  };

  const handleSaveEdit = async (vendorId: string) => {
    if (!editVendor.name || !editVendor.email || !editVendor.phone || !editVendor.baseQuote) {
      setError("Please fill in all required fields including pricing");
      return;
    }

    const baseQuoteNum = parseFloat(editVendor.baseQuote);
    if (isNaN(baseQuoteNum) || baseQuoteNum <= 0) {
      setError("Please enter a valid base quote amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updates = {
        name: editVendor.name,
        email: editVendor.email,
        phone: editVendor.phone,
        specialities: editVendor.specialities.split(",").map(s => s.trim()).filter(s => s),
        location: editVendor.location,
        description: editVendor.description,
        baseQuote: baseQuoteNum,
      };

      await updateVendorInFirebase(vendorId, updates);
      setEditingVendor(null);
    } catch (err: any) {
      console.error("Failed to update vendor:", err);
      setError("Failed to update vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setError("");
  };

  if (!issue) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle>Assign Vendor for Issue</DialogTitle>
          <DialogDescription>
            {issue.title} • {issue.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{issue.location.address}</p>
                  <p className="text-muted-foreground mt-1">{issue.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Vendors</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddVendor(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Vendor
              </Button>
            </div>

            {displayVendors.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {displayVendors.map((vendor) => (
                  <Card key={vendor.id} className="h-full">
                    {editingVendor === vendor.id ? (
                      <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Edit Vendor</h3>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(vendor.id)}
                              disabled={loading}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${vendor.id}`}>Vendor Name *</Label>
                            <Input
                              id={`edit-name-${vendor.id}`}
                              value={editVendor.name}
                              onChange={(e) => setEditVendor({...editVendor, name: e.target.value})}
                              placeholder="Vendor name"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-email-${vendor.id}`}>Email *</Label>
                            <Input
                              id={`edit-email-${vendor.id}`}
                              value={editVendor.email}
                              onChange={(e) => setEditVendor({...editVendor, email: e.target.value})}
                              placeholder="Email"
                              type="email"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-phone-${vendor.id}`}>Phone *</Label>
                            <Input
                              id={`edit-phone-${vendor.id}`}
                              value={editVendor.phone}
                              onChange={(e) => setEditVendor({...editVendor, phone: e.target.value})}
                              placeholder="Phone"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-baseQuote-${vendor.id}`}>Base Quote (₹) *</Label>
                            <Input
                              id={`edit-baseQuote-${vendor.id}`}
                              value={editVendor.baseQuote}
                              onChange={(e) => setEditVendor({...editVendor, baseQuote: e.target.value})}
                              placeholder="Base quote"
                              type="number"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-location-${vendor.id}`}>Location</Label>
                            <Input
                              id={`edit-location-${vendor.id}`}
                              value={editVendor.location}
                              onChange={(e) => setEditVendor({...editVendor, location: e.target.value})}
                              placeholder="Location"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-specialities-${vendor.id}`}>Specialities (comma separated)</Label>
                            <Input
                              id={`edit-specialities-${vendor.id}`}
                              value={editVendor.specialities}
                              onChange={(e) => setEditVendor({...editVendor, specialities: e.target.value})}
                              placeholder="Specialities"
                              className="border"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`edit-description-${vendor.id}`}>Description</Label>
                            <Textarea
                              id={`edit-description-${vendor.id}`}
                              value={editVendor.description}
                              onChange={(e) => setEditVendor({...editVendor, description: e.target.value})}
                              placeholder="Description"
                              rows={3}
                              className="border"
                            />
                          </div>
                        </div>
                        
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="flex items-center gap-2 mb-2">
                                <span className="truncate">{vendor.name}</span>
                                {vendor.verified && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 flex-shrink-0">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{vendor.rating || "New"}</span>
                                </div>
                                <div className="text-muted-foreground">
                                  {vendor.totalJobs} jobs
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-green-600 mb-1">
                                ₹{vendor.baseQuote.toLocaleString()}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditVendor(vendor)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {vendor.description && (
                            <p className="text-muted-foreground">{vendor.description}</p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{vendor.phone}</span>
                            </div>
                            {vendor.location && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>{vendor.location}</span>
                              </div>
                            )}
                          </div>

                          {vendor.specialities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {vendor.specialities.map((speciality) => (
                                <Badge key={speciality} variant="outline">
                                  {speciality}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <Button
                            onClick={() => handleAssignVendor(vendor.id)}
                            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                            disabled={selectedVendor === vendor.id}
                          >
                            {selectedVendor === vendor.id ? "Assigned" : "Assign This Vendor"}
                          </Button>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-6">
                    No vendors available for this category. Add a new vendor to get started.
                  </p>
                  <Button onClick={() => setShowAddVendor(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Vendor
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add New Vendor */}
          {showAddVendor && (
            <Card className="border-2 border-cyan-200" ref={addVendorRef}>
              <CardHeader>
                <CardTitle>Add New Vendor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-name">Vendor Name *</Label>
                    <Input
                      id="vendor-name"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      placeholder="Enter vendor name"
                      className="border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-email">Email *</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                      placeholder="vendor@example.com"
                      className="border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-phone">Phone *</Label>
                    <Input
                      id="vendor-phone"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                      placeholder="+91-9876543210"
                      className="border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-location">Location</Label>
                    <Input
                      id="vendor-location"
                      value={newVendor.location}
                      onChange={(e) => setNewVendor({...newVendor, location: e.target.value})}
                      placeholder="City, State"
                      className="border"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-base-quote">Base Quote (₹) *</Label>
                    <Input
                      id="vendor-base-quote"
                      type="number"
                      value={newVendor.baseQuote}
                      onChange={(e) => setNewVendor({...newVendor, baseQuote: e.target.value})}
                      placeholder="Enter base pricing"
                      min="0"
                      className="border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-specialities">Specialities (comma separated)</Label>
                    <Input
                      id="vendor-specialities"
                      value={newVendor.specialities}
                      onChange={(e) => setNewVendor({...newVendor, specialities: e.target.value})}
                      placeholder="Road/Sidewalk, Street Lighting, etc."
                      className="border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-description">Description</Label>
                  <Textarea
                    id="vendor-description"
                    value={newVendor.description}
                    onChange={(e) => setNewVendor({...newVendor, description: e.target.value})}
                    placeholder="Brief description of services"
                    rows={3}
                    className="border"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddVendor(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddVendor}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                  >
                    {loading ? "Adding..." : "Add Vendor"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
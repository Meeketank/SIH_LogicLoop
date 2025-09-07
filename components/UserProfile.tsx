import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { UserProfile as UserProfileType, updateUserProfile, deleteUserAccount } from '../services/auth';
import { auth } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { User, Camera, Edit, Trash2, LogOut, Phone, Mail } from 'lucide-react';

interface UserProfileProps {
  userProfile: UserProfileType;
  onProfileUpdate: (updatedProfile: UserProfileType) => void;
  onSignOut: () => void;
}

export function UserProfile({ userProfile, onProfileUpdate, onSignOut }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile.name,
    phone: userProfile.phone,
    email: userProfile.email
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Image size should be less than 2MB');
        return;
      }
      setProfileImage(file);
    }
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    const imageRef = ref(storage, `profile-images/${userProfile.uid}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let profileImageUrl = userProfile.profileImageUrl;

      // Upload new profile image if selected
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage);
      }

      const updates = {
        name: formData.name,
        phone: formData.phone,
        profileImageUrl
      };

      // Update Firebase Auth profile
      if (auth.currentUser && userProfile.uid !== 'admin') {
        await updateProfile(auth.currentUser, { 
          displayName: formData.name,
          photoURL: profileImageUrl 
        });
      }

      // Update Firestore profile
      if (userProfile.uid !== 'admin') {
        await updateUserProfile(userProfile.uid, updates);
      }

      const updatedProfile = { ...userProfile, ...updates };
      onProfileUpdate(updatedProfile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setProfileImage(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (userProfile.uid === 'admin') {
      setError('Cannot delete admin account');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await deleteUserAccount(auth.currentUser);
      }
      onSignOut();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile.profileImageUrl} />
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{userProfile.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            Manage your profile information and account settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={profileImage ? URL.createObjectURL(profileImage) : userProfile.profileImageUrl} 
              />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-2xl">
                {getInitials(userProfile.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
              <Badge variant="outline" className="capitalize">
                {userProfile.role}
              </Badge>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setFormData({
                      name: userProfile.name,
                      phone: userProfile.phone,
                      email: userProfile.email
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={userProfile.uid === 'admin'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      value={formData.email}
                      disabled={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={userProfile.uid === 'admin'}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.phone}</span>
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {isEditing && (
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={onSignOut}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            
            {userProfile.uid !== 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
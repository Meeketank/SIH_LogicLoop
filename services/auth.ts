import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User,
  deleteUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, isFirebaseAvailable, handleFirebaseError } from './firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'admin';
  profileImageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export const registerUser = async (
  email: string, 
  password: string, 
  name: string, 
  phone: string
): Promise<UserProfile> => {
  if (!isFirebaseAvailable) {
    // Create a mock user profile for offline mode
    const mockProfile: UserProfile = {
      uid: `offline_${Date.now()}`,
      name,
      email,
      phone,
      role: 'citizen',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to local storage
    localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(mockProfile));
    return mockProfile;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, { displayName: name });

    const userProfile: UserProfile = {
      uid: user.uid,
      name,
      email,
      phone,
      role: 'citizen',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save user profile to Firestore
    await setDoc(doc(db, 'users', user.uid), userProfile);

    return userProfile;
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const signInUser = async (email: string, password: string): Promise<UserProfile> => {
  // Check for admin credentials
  if (email === 'admin' && password === 'admin') {
    // Create a mock admin user
    const adminProfile: UserProfile = {
      uid: 'admin',
      name: 'Administrator',
      email: 'admin@vikasitjharkhand.gov.in',
      phone: '+91-9999999999',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(adminProfile));
    return adminProfile;
  }

  if (!isFirebaseAvailable) {
    // Check local storage for demo purposes
    const demoUsers = [
      {
        email: 'demo@vikasitjharkhand.gov.in',
        password: 'demo123',
        profile: {
          uid: 'demo_user',
          name: 'Demo Citizen',
          email: 'demo@vikasitjharkhand.gov.in',
          phone: '+91-9876543210',
          role: 'citizen' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    const demoUser = demoUsers.find(u => u.email === email && u.password === password);
    if (demoUser) {
      localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(demoUser.profile));
      return demoUser.profile;
    }

    throw new Error('Invalid credentials. Try demo@vikasitjharkhand.gov.in / demo123 or register a new account.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const profile = userDoc.data() as UserProfile;
    localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(profile));
    return profile;
  } catch (error: any) {
    console.error('Sign in failed:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const signOut = async (): Promise<void> => {
  try {
    if (isFirebaseAvailable && auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.error('Sign out failed:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('vikasit_jharkhand_user');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (uid === 'admin') {
    return {
      uid: 'admin',
      name: 'Administrator',
      email: 'admin@vikasitjharkhand.gov.in',
      phone: '+91-9999999999',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() as UserProfile : null;
};

export const updateUserProfile = async (
  uid: string, 
  updates: Partial<UserProfile>
): Promise<void> => {
  if (uid === 'admin') {
    throw new Error('Cannot update admin profile');
  }

  if (!isFirebaseAvailable) {
    // Update local storage
    const stored = localStorage.getItem('vikasit_jharkhand_user');
    if (stored) {
      const profile = JSON.parse(stored);
      const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
      localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(updatedProfile));
    }
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Update local storage as well
    const stored = localStorage.getItem('vikasit_jharkhand_user');
    if (stored) {
      const profile = JSON.parse(stored);
      const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
      localStorage.setItem('vikasit_jharkhand_user', JSON.stringify(updatedProfile));
    }
  } catch (error) {
    console.error('Update profile failed:', error);
    throw new Error(handleFirebaseError(error));
  }
};

export const deleteUserAccount = async (user: User): Promise<void> => {
  if (user.uid === 'admin') {
    throw new Error('Cannot delete admin account');
  }

  if (!isFirebaseAvailable) {
    // Just clear local storage
    localStorage.removeItem('vikasit_jharkhand_user');
    return;
  }

  try {
    // Delete user profile from Firestore
    await deleteDoc(doc(db, 'users', user.uid));
    
    // Delete user account
    await deleteUser(user);
    
    // Clear local storage
    localStorage.removeItem('vikasit_jharkhand_user');
  } catch (error) {
    console.error('Delete account failed:', error);
    throw new Error(handleFirebaseError(error));
  }
};
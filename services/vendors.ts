import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialities: string[];
  location: string;
  rating: number;
  totalJobs: number;
  baseQuote: number;
  description: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VENDORS_COLLECTION = 'vendors';

export const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, VENDORS_COLLECTION), {
      ...vendorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

export const updateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
  try {
    const vendorRef = doc(db, VENDORS_COLLECTION, vendorId);
    await updateDoc(vendorRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

export const deleteVendor = async (vendorId: string) => {
  try {
    const vendorRef = doc(db, VENDORS_COLLECTION, vendorId);
    await deleteDoc(vendorRef);
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
};

export const subscribeToVendors = (callback: (vendors: Vendor[]) => void) => {
  const q = query(collection(db, VENDORS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const vendors: Vendor[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      vendors.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Vendor);
    });
    callback(vendors);
  }, (error) => {
    console.error('Error listening to vendors:', error);
    callback([]);
  });
};

export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const { getDoc } = await import('firebase/firestore');
    const vendorRef = doc(db, VENDORS_COLLECTION, vendorId);
    const vendorDoc = await getDoc(vendorRef);
    
    if (vendorDoc.exists()) {
      const data = vendorDoc.data();
      return {
        id: vendorDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Vendor;
    }
    return null;
  } catch (error) {
    console.error('Error getting vendor:', error);
    return null;
  }
};
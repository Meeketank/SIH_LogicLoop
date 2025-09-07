import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, isFirebaseAvailable } from "./firebase";
import { Issue } from "../components/IssueCard";

// ---------------- Add Issue ----------------
export const addIssue = async (
  issueData: Omit<Issue, "id" | "reportedAt">
): Promise<string> => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  try {
    const issue = {
      ...issueData,
      reportedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "issues"), issue);
    return docRef.id;
  } catch (error) {
    console.error("Firebase addIssue failed:", error);
    throw error;
  }
};

// ---------------- Update Issue ----------------
export const updateIssue = async (
  issueId: string,
  updates: Partial<Issue>
): Promise<void> => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  const issueRef = doc(db, "issues", issueId);
  await updateDoc(issueRef, { ...updates, updatedAt: serverTimestamp() });
};

// ---------------- Delete Issue ----------------
export const deleteIssue = async (issueId: string): Promise<void> => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  await deleteDoc(doc(db, "issues", issueId));
};

// ---------------- Get All Issues (Admin) ----------------
export const getIssues = async (): Promise<Issue[]> => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    reportedAt: doc.data().reportedAt?.toDate() || new Date(),
  })) as Issue[];
};

// ---------------- Get Issues by User ----------------
export const getUserIssues = async (userEmail: string): Promise<Issue[]> => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  const q = query(
    collection(db, "issues"),
    where("reportedBy", "==", userEmail),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    reportedAt: doc.data().reportedAt?.toDate() || new Date(),
  })) as Issue[];
};

// ---------------- Subscribe to Issues ----------------
export const subscribeToIssues = (callback: (issues: Issue[]) => void) => {
  if (!isFirebaseAvailable) throw new Error("Firebase not available");

  const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportedAt: doc.data().reportedAt?.toDate() || new Date(),
    })) as Issue[];
    callback(issues);
  });
};

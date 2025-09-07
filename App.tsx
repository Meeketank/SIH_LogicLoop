import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Switch } from "./components/ui/switch";
import { Badge } from "./components/ui/badge";
import { CitizenApp } from "./components/CitizenApp";
import { AdminDashboard } from "./components/AdminDashboard";
import { AuthLogin } from "./components/AuthLogin";
import { AuthRegister } from "./components/AuthRegister";
import { UserProfile } from "./components/UserProfile";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Issue } from "./components/IssueCard";
import {
  UserProfile as UserProfileType,
  signOut,
} from "./services/auth";
import { subscribeToIssues } from "./services/issues";
import { Users, Shield, FileText } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfileType | null>(
    null,
  );
  const [authView, setAuthView] = useState<
    "login" | "register"
  >("login");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    // Check for existing user session
    const checkExistingSession = () => {
      try {
        const stored = localStorage.getItem(
          "vikasit_jharkhand_user",
        );
        if (stored) {
          const userProfile = JSON.parse(stored);
          setUser(userProfile);
        }
      } catch (error) {
        console.error(
          "Error checking existing session:",
          error,
        );
      }
    };

    checkExistingSession();

    // Initialize Firebase listeners
    const unsubscribe = subscribeToIssues((fetchedIssues) => {
      setIssues(fetchedIssues);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userProfile: UserProfileType) => {
    setUser(userProfile);
  };

  const handleRegister = (userProfile: UserProfileType) => {
    setUser(userProfile);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setUser(null);
  };

  const handleProfileUpdate = (
    updatedProfile: UserProfileType,
  ) => {
    setUser(updatedProfile);
  };

  //new added
  const handleSelectRole = (role: "citizen" | "admin") => {
    if (!user) return; // safeguard
    const updatedProfile: UserProfileType = { ...user, role };
    setUser(updatedProfile);
    localStorage.setItem(
      "vikasit_jharkhand_user",
      JSON.stringify(updatedProfile),
    );
  };

  const handleUpdateIssue = (
    issueId: string,
    updates: Partial<Issue>,
  ) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, ...updates } : issue,
      ),
    );
  };

  // Show loading screen while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">विकसित</span>
          </div>
          <h1 className="text-2xl font-bold text-cyan-900 mb-2">
            Vikasit Jharkhand
          </h1>
          <p className="text-cyan-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication screens if user is not logged in
  if (!user) {
    if (authView === "login") {
      return (
        <AuthLogin
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView("register")}
        />
      );
    } else {
      return (
        <AuthRegister
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }
  }

  // Role selection screen (only for first-time users)
  //|| (user.role && !user.uid.includes('admin') && user.role === 'citizen')
  if (!user.role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-2xl">
                  विकसित
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-cyan-900 mb-1">
                  Vikasit Jharkhand
                </h1>
                <p className="text-sm text-cyan-600">
                  विकसित झारखंड
                </p>
              </div>
            </div>
            <p className="text-lg text-cyan-700 mb-4">
              Government of Jharkhand's Civic Issue Management
              Platform
            </p>
            <p className="text-sm text-cyan-600 mb-8">
              झारखंड सरकार की नागरिक समस्या प्रबंधन प्रणाली
            </p>
            <Badge variant="outline" className="mb-8">
              Demo Version - Choose Your Role
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-cyan-300"
              onClick={() => handleSelectRole("citizen")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">
                  Citizen Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Report civic issues in your community and
                  track them
                </p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    Submit issues with photos and location
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    Track status updates in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    Voice recording support
                  </li>
                </ul>
                <Button
                  onClick={() => handleSelectRole("citizen")}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                >
                  Enter as Citizen
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-teal-300"
              onClick={() => handleSelectRole("admin")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">
                  Admin Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Manage civic issues, assign tasks, and analyze
                  trends
                </p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-600 rounded-full" />
                    Interactive city map with markers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-600 rounded-full" />
                    Task assignment and workflow
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-600 rounded-full" />
                    Analytics and reporting tools
                  </li>
                </ul>
                <Button
                  onClick={() => handleSelectRole("admin")}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  Enter as Admin
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2">
              Empowering citizens to build a better Jharkhand
              through technology
            </p>
            <p className="text-xs text-muted-foreground">
              An initiative by the Government of Jharkhand for
              digital governance and citizen engagement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with User Profile */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">
                  VJ
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold truncate">
                  Vikasit Jharkhand
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gov. of Jharkhand
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge
                variant="outline"
                className="capitalize"
              >
                {user.role}
              </Badge>
              <ConnectionStatus />
              <UserProfile
                userProfile={user}
                onProfileUpdate={handleProfileUpdate}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main App Content */}
      <ErrorBoundary>
        {user.role === "admin" || user.uid === "admin" ? (
          <AdminDashboard
            issues={issues}
            onUpdateIssue={handleUpdateIssue}
            currentUser={user}
          />
        ) : (
          <CitizenApp issues={issues} currentUser={user} />
        )}
      </ErrorBoundary>
    </div>
  );
}
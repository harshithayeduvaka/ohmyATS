import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Email</label>
                <p className="text-sm font-medium text-foreground mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">User ID</label>
                <p className="text-xs font-mono text-muted-foreground mt-1">{user.id}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Joined</label>
                <p className="text-sm text-foreground mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to view your profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

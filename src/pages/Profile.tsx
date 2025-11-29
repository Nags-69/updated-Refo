import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, CheckCircle2, LogOut, Edit2, Save, X, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import BadgesDisplay from "@/components/BadgesDisplay";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setProfile(data);
      setNewUsername(data.username || "");
    }
    if (error) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim()) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast({ 
        title: "Update failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Success", description: "Username updated successfully" });
      setIsEditingUsername(false);
      loadProfile();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: "Error", description: "New password cannot be the same as the current one.", variant: "destructive" });
      return;
    }
    if (!user?.email) {
      toast({ title: "Error", description: "User email not found.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // First, verify the current password is correct
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      toast({ title: "Error", description: "Incorrect current password.", variant: "destructive" });
      return;
    }

    // If current password is correct, update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      toast({ title: "Error updating password", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold mb-8">Profile</h1>

        {/* Profile Info Card - Restored from placeholder */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User />}
              </div>
              {profile?.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-success fill-success/10" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 w-full">
              <div className="flex items-center justify-center md:justify-start gap-2">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2 w-full max-w-[250px]">
                    <Input 
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username"
                      className="h-8"
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleUpdateUsername} disabled={loading}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setIsEditingUsername(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{profile?.username || "User"}</h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setIsEditingUsername(true)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                <div className="flex items-center justify-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                <Badge variant={profile?.is_verified ? "default" : "secondary"} className={profile?.is_verified ? "bg-success hover:bg-success/90" : ""}>
                  {profile?.is_verified ? "Verified User" : "Unverified"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(profile?.created_at || new Date()).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Badges */}
        <div className="mb-6">
          <BadgesDisplay />
        </div>

        {/* Change Password */}
        <Card className="p-6 mb-6">
          <h3 className="font-heading font-semibold text-lg mb-4">Change Password</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
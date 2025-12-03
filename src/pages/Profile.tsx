import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, CheckCircle2, LogOut, Edit2, Save, X, Calendar, Image as ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import BadgesDisplay from "@/components/BadgesDisplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { compressImage } from "@/utils/imageCompression";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<string[]>([]);
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (isPresetOpen) {
      loadPresets();
    }
  }, [isPresetOpen]);

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

  const loadPresets = async () => {
    const { data, error } = await supabase.storage.from('avatars').list('presets');

    if (error) {
      toast({ title: "Error", description: "Failed to load avatars", variant: "destructive" });
      return;
    }

    if (data) {
      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`presets/${file.name}`);
        return publicUrl;
      });
      setPresets(urls);
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

  const isPasswordSet = user?.app_metadata?.providers?.includes('email');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (isPasswordSet && newPassword === currentPassword) {
      toast({ title: "Error", description: "New password cannot be the same as the current one.", variant: "destructive" });
      return;
    }
    if (!user?.email) {
      toast({ title: "Error", description: "User email not found.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Only verify current password if the user actually has one set
    if (isPasswordSet) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setLoading(false);
        toast({ title: "Error", description: "Incorrect current password.", variant: "destructive" });
        return;
      }
    }

    // Update to the new password
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setLoading(true);
      const originalFile = event.target.files[0];

      // Compress the image before uploading
      let file = originalFile;
      try {
        file = await compressImage(originalFile);
      } catch (compressionError) {
        console.warn("Image compression failed, using original file:", compressionError);
        // Fallback to original file if compression fails
      }

      const fileExt = file.name.split('.').pop();
      // Use timestamp for safer filename to avoid 400 Bad Request
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile({ ...profile, avatar_url: null });
      toast({ title: "Success", description: "Avatar removed" });
    }
    setLoading(false);
  };

  const handlePresetSelect = async (url: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile({ ...profile, avatar_url: url });
      toast({ title: "Success", description: "Avatar updated" });
      setIsPresetOpen(false);
    }
    setLoading(false);
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

        {/* Profile Info Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0 group">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User />
                )}
              </div>

              {/* Avatar Actions */}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                {profile?.avatar_url && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={handleRemoveAvatar}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <Dialog open={isPresetOpen} onOpenChange={setIsPresetOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Choose Avatar</DialogTitle>
                      <DialogDescription>
                        Select one of our preset avatars to use as your profile picture.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      {presets.map((url, index) => (
                        <button
                          key={index}
                          className="relative aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                          onClick={() => handlePresetSelect(url)}
                          disabled={loading}
                        >
                          <img src={url} alt={`Preset ${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <label
                  htmlFor="avatar-upload"
                  className="flex items-center justify-center h-8 w-8 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </label>
              </div>

              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={loading}
              />

              {profile?.is_verified && (
                <div className="absolute top-0 right-0 bg-background rounded-full p-1 shadow-sm z-10">
                  <CheckCircle2 className="h-5 w-5 text-success fill-success/10" />
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
          <h3 className="font-heading font-semibold text-lg mb-4">
            {isPasswordSet ? "Change Password" : "Set Password"}
          </h3>
          <div className="space-y-4">
            {isPasswordSet && (
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
            )}
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
              {loading ? "Updating..." : (isPasswordSet ? "Change Password" : "Set Password")}
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
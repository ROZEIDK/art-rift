import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Heart, Camera } from "lucide-react";

interface Profile {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  show_mature_content: boolean;
}

interface Artwork {
  id: string;
  title: string;
  image_url: string;
  view_count: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchArtworks();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchArtworks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("artworks")
        .select("id, title, image_url, view_count")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtworks(data || []);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile!, avatar_url: data.publicUrl });
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          website_url: profile.website_url,
          show_mature_content: profile.show_mature_content,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="text-sm">{profile.bio}</p>}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {profile.website_url}
              </a>
            )}
          </div>
          <Button onClick={() => setEditing(!editing)} variant="outline">
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </CardHeader>
        {editing && (
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website_url || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, website_url: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mature"
                  checked={profile.show_mature_content}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, show_mature_content: checked as boolean })
                  }
                />
                <Label
                  htmlFor="mature"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show mature content (18+)
                </Label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="artworks" className="w-full">
        <TabsList>
          <TabsTrigger value="artworks">Artworks ({artworks.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="artworks" className="space-y-4">
          {artworks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No artworks yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map((artwork) => (
                <Card key={artwork.id} className="overflow-hidden group">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium line-clamp-1">{artwork.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{artwork.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="favorites">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No favorites yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleBadge } from "@/components/RoleBadge";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
}

interface Artwork {
  id: string;
  title: string;
  image_url: string;
  view_count: number;
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { roles } = useUserRole(id);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  useEffect(() => {
    if (currentUserId && id && currentUserId !== id) {
      checkIfFollowing();
    }
  }, [currentUserId, id]);

  const fetchUserData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: artworksData, error: artworksError } = await supabase
        .from("artworks")
        .select("id, title, image_url, view_count")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      if (artworksError) throw artworksError;
      setArtworks(artworksData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", id)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow artists",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", id);
        setIsFollowing(false);
        toast({ title: "Unfollowed artist" });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: id });
        setIsFollowing(true);
        toast({ title: "Following artist" });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-6">User not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.display_name || profile.username}
                    </h1>
                    {roles.filter(r => r !== 'user').map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </div>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                {currentUserId && currentUserId !== profile.id && (
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={toggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
              {profile.bio && (
                <p className="mt-4 text-foreground">{profile.bio}</p>
              )}
              {profile.website_url && (
                <Button variant="link" className="mt-2 p-0" asChild>
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Artworks ({artworks.length})
        </h2>
        {artworks.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No artworks yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork) => (
              <Link key={artwork.id} to={`/artwork/${artwork.id}`}>
                <Card className="overflow-hidden border-border hover:border-primary transition-colors cursor-pointer group">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate">
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {artwork.view_count} views
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
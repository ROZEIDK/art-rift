import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "@/components/CommentSection";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  user_id: string;
  created_at: string;
  view_count: number;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchArtwork();
      incrementViewCount();
    }
  }, [id]);

  useEffect(() => {
    if (currentUserId && id) {
      checkIfFavorited();
    }
  }, [currentUserId, id]);

  useEffect(() => {
    if (currentUserId && artwork) {
      checkIfFollowing();
    }
  }, [currentUserId, artwork]);

  const fetchArtwork = async () => {
    try {
      const { data: artworkData, error: artworkError } = await supabase
        .from("artworks")
        .select("*")
        .eq("id", id)
        .single();

      if (artworkError) throw artworkError;
      setArtwork(artworkData);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", artworkData.user_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: tagsData, error: tagsError } = await supabase
        .from("artwork_tags")
        .select("tag_id, tags(name)")
        .eq("artwork_id", id);

      if (!tagsError && tagsData) {
        setTags(tagsData.map((t: any) => t.tags.name));
      }

      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("artwork_id", id);

      setFavoriteCount(count || 0);
    } catch (error) {
      console.error("Error fetching artwork:", error);
      toast({
        title: "Error",
        description: "Failed to load artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_view_count", { artwork_id: id });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("artwork_id", id)
        .maybeSingle();

      setIsFavorited(!!data);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const checkIfFollowing = async () => {
    if (!artwork) return;
    try {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", artwork.user_id)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite artworks",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("artwork_id", id);
        setIsFavorited(false);
        setFavoriteCount(favoriteCount - 1);
        toast({ title: "Removed from favorites" });
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: currentUserId, artwork_id: id });
        setIsFavorited(true);
        setFavoriteCount(favoriteCount + 1);
        toast({ title: "Added to favorites" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
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

    if (!artwork) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", artwork.user_id);
        setIsFollowing(false);
        toast({ title: "Unfollowed artist" });
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: artwork.user_id });
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this artwork?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("artworks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Artwork deleted successfully" });
      navigate("/");
    } catch (error) {
      console.error("Error deleting artwork:", error);
      toast({
        title: "Error",
        description: "Failed to delete artwork",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!artwork || !profile) {
    return <div className="p-6">Artwork not found</div>;
  }

  const isOwner = currentUserId === artwork.user_id;

  return (
    <div className="max-w-6xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-border">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-auto object-contain bg-muted"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-bold text-foreground">{artwork.title}</h1>
              
              {artwork.description && (
                <p className="text-muted-foreground">{artwork.description}</p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  onClick={toggleFavorite}
                  className="flex-1"
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                  {favoriteCount} {favoriteCount === 1 ? "Favorite" : "Favorites"}
                </Button>

                {isOwner && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <Link to={`/user/${profile.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{profile.display_name || profile.username}</p>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
              </Link>

              {!isOwner && currentUserId && (
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={toggleFollow}
                  className="w-full"
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
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Views</span>
                <span className="text-foreground font-medium">{artwork.view_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploaded</span>
                <span className="text-foreground font-medium">
                  {new Date(artwork.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <CommentSection artworkId={id!} />
      </div>
    </div>
  );
};

export default ArtworkDetail;
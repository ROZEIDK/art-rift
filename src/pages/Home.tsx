import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Heart } from "lucide-react";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const Home = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatureContent, setShowMatureContent] = useState(false);

  useEffect(() => {
    fetchUserPreference();
  }, []);

  useEffect(() => {
    fetchFeedArtworks();
  }, [showMatureContent]);

  const fetchUserPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowMatureContent(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("show_mature_content")
        .eq("id", user.id)
        .single();

      if (profile) {
        setShowMatureContent(profile.show_mature_content || false);
      }
    } catch (error) {
      console.error("Error fetching user preference:", error);
    }
  };

  const fetchFeedArtworks = async () => {
    try {
      let query = supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Filter mature content based on user preference
      if (!showMatureContent) {
        query = query.or("mature_content.is.null,mature_content.eq.false");
      }

      const { data: artworkData, error } = await query;

      if (error) throw error;

      // Fetch profiles for each artwork
      const artworksWithProfiles = await Promise.all(
        (artworkData || []).map(async (artwork) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", artwork.user_id)
            .single();

          return {
            ...artwork,
            profiles: profile || { username: "Unknown", avatar_url: null },
          };
        })
      );

      setArtworks(artworksWithProfiles);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Feed</h1>
        <p className="text-muted-foreground">Discover amazing artwork from artists around the world</p>
      </div>

      {artworks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No artworks yet. Be the first to share!</p>
            <Link to="/upload">
              <Button>Upload Your First Artwork</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Link key={artwork.id} to={`/artwork/${artwork.id}`}>
              <Card className="overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="line-clamp-1">{artwork.title}</CardTitle>
                  {artwork.description && (
                    <CardDescription className="line-clamp-2">{artwork.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={artwork.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{artwork.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{artwork.profiles?.username}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>0</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Eye, Heart, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  artwork_tags: Array<{
    tags: {
      name: string;
    };
  }>;
}

const Browse = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const { data: artworkData, error } = await supabase
        .from("artworks")
        .select(`
          *,
          artwork_tags (
            tags (
              name
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

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

  const filteredArtworks = artworks.filter((artwork) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      artwork.title.toLowerCase().includes(searchLower) ||
      artwork.description?.toLowerCase().includes(searchLower) ||
      artwork.profiles?.username.toLowerCase().includes(searchLower) ||
      artwork.artwork_tags.some((at) => at.tags.name.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading artworks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Browse Artworks</h1>
        <p className="text-muted-foreground">Explore the creative community</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, description, artist, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredArtworks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No artworks found matching your search" : "No artworks available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden group hover:border-primary/50 transition-all">
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
                {artwork.artwork_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {artwork.artwork_tags.slice(0, 3).map((at, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {at.tags.name}
                      </Badge>
                    ))}
                  </div>
                )}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;

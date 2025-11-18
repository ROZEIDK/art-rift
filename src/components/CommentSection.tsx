import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be less than 1000 characters" }),
});

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  artworkId: string;
}

export const CommentSection = ({ artworkId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [artworkId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("artwork_id", artworkId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || { username: "Unknown", display_name: null, avatar_url: null },
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = commentSchema.parse({ content: newComment });
      setIsSubmitting(true);

      const { error } = await supabase.from("comments").insert({
        user_id: currentUserId,
        artwork_id: artworkId,
        content: validatedData.content,
      });

      if (error) throw error;

      setNewComment("");
      toast({ title: "Comment posted successfully" });
      fetchComments();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid comment",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error posting comment:", error);
        toast({
          title: "Error",
          description: "Failed to post comment",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({ title: "Comment deleted" });
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Comments ({comments.length})
      </h3>

      {currentUserId && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/1000 characters
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
              >
                Post Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Link to={`/user/${comment.user_id}`}>
                    <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                      <AvatarImage src={comment.profiles.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {comment.profiles.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/user/${comment.user_id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {comment.profiles.display_name || comment.profiles.username}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()} at{" "}
                          {new Date(comment.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {currentUserId === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
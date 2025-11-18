-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(artwork_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artworks
  SET view_count = view_count + 1
  WHERE id = artwork_id;
END;
$$;
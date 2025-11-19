-- Add show_mature_content preference to profiles table
ALTER TABLE public.profiles
ADD COLUMN show_mature_content BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.show_mature_content IS 'User preference to show or hide mature content (default: hidden)';
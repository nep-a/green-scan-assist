-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plant_images table
CREATE TABLE public.plant_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_image_id UUID NOT NULL REFERENCES public.plant_images(id) ON DELETE CASCADE,
  disease_name TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  symptoms TEXT,
  treatment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-images', 'plant-images', false);

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS policies for plant_images
CREATE POLICY "Users can view their own plant images" 
ON public.plant_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plant images" 
ON public.plant_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant images" 
ON public.plant_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for predictions
CREATE POLICY "Users can view predictions for their images" 
ON public.predictions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.plant_images 
    WHERE plant_images.id = predictions.plant_image_id 
    AND plant_images.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert predictions" 
ON public.predictions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plant_images 
    WHERE plant_images.id = predictions.plant_image_id 
    AND plant_images.user_id = auth.uid()
  )
);

-- Storage policies for plant images
CREATE POLICY "Users can view their own plant images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'plant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own plant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'plant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own plant images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'plant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
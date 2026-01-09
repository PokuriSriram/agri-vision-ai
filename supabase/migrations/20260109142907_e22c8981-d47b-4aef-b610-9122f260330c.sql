-- Create table for storing detection results
CREATE TABLE public.detection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  detection_type TEXT NOT NULL CHECK (detection_type IN ('image', 'video', 'live_feed')),
  weeds_detected BOOLEAN NOT NULL DEFAULT false,
  weed_count INTEGER DEFAULT 0,
  weed_details JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC(5,4),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.detection_results ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no accounts required)
CREATE POLICY "Anyone can view detection results" 
ON public.detection_results 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can insert detection results" 
ON public.detection_results 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_detection_results_created_at ON public.detection_results(created_at DESC);
CREATE INDEX idx_detection_results_weeds_detected ON public.detection_results(weeds_detected);
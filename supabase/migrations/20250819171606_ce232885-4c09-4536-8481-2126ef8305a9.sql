-- Fix security vulnerability: Remove public access to salespeople contact information
-- This prevents competitors from harvesting email addresses and phone numbers

DROP POLICY IF EXISTS "Public can view active salespeople" ON public.salespeople;

-- The existing "Authenticated users can view salespeople" policy will still allow 
-- legitimate authenticated users to access salespeople data, maintaining functionality
-- while preventing unauthorized access to sensitive contact information
-- Fix RLS policy for stores to allow authenticated users to create their first store
-- This fixes the "new row violates row-level security policy" error during signup

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Store owners can manage their stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;

-- Create new policies
-- Policy 1: Allow authenticated users to create stores
CREATE POLICY "Authenticated users can create stores" ON stores
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Policy 2: Allow store owners to manage their stores
CREATE POLICY "Store owners can manage their stores" ON stores
    FOR ALL 
    USING (auth.uid() = owner_id);

-- Keep the existing policy for viewing active stores
-- (This should already exist, but just in case)
DROP POLICY IF EXISTS "Anyone can view active stores" ON stores;
CREATE POLICY "Anyone can view active stores" ON stores
    FOR SELECT 
    USING (is_active = true);

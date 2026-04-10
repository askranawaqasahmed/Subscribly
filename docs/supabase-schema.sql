-- ============================================
-- Subscribly Database Schema for Supabase PostgreSQL
-- ============================================
-- Description: Complete database schema including tables, indexes, 
--              Row Level Security policies, and database functions (RPC)
-- Version: 1.0
-- Date: 2026-04-10
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Payment type for subscriptions
CREATE TYPE payment_type AS ENUM ('equal', 'individual');

-- Invoice status
CREATE TYPE invoice_status AS ENUM ('generated', 'sent', 'paid');

-- ============================================
-- TABLES
-- ============================================

-- --------------------------------------------
-- profiles table
-- --------------------------------------------
-- Extends auth.users with application-specific user data
-- Automatically created via trigger when user signs up

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);

-- --------------------------------------------
-- subscriptions table
-- --------------------------------------------
-- Core subscription entities (Netflix, Spotify, etc.)

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    total_amount DECIMAL(18,2) NOT NULL CHECK (total_amount > 0),
    payment_type payment_type NOT NULL DEFAULT 'equal',
    total_members INTEGER NOT NULL DEFAULT 1 CHECK (total_members > 0),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by ON public.subscriptions(created_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at DESC);

-- --------------------------------------------
-- user_subscriptions table
-- --------------------------------------------
-- Junction table linking users to subscriptions as members

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    subscriber_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only be a member once per subscription
    UNIQUE(subscription_id, subscriber_user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription ON public.user_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscriber ON public.user_subscriptions(subscriber_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON public.user_subscriptions(is_active);

-- --------------------------------------------
-- payments table
-- --------------------------------------------
-- Individual payment records per member per cycle

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_on TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_subscription ON public.payments(user_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON public.payments(is_paid);
CREATE INDEX IF NOT EXISTS idx_payments_expiry_date ON public.payments(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON public.payments(created_by);

-- --------------------------------------------
-- invoices table
-- --------------------------------------------
-- Generated invoices for unpaid amounts

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    issued_to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount DECIMAL(18,2) NOT NULL CHECK (total_amount > 0),
    months_covered TEXT NOT NULL,
    status invoice_status NOT NULL DEFAULT 'generated',
    sent_on TIMESTAMPTZ,
    paid_on TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_user_subscription ON public.invoices(user_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_to ON public.invoices(issued_to_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);

-- ============================================
-- TRIGGERS
-- ============================================

-- --------------------------------------------
-- Trigger: Update updated_at timestamp
-- --------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------
-- Trigger: Create profile on user signup
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- profiles RLS policies
-- --------------------------------------------

-- Users can view all profiles (for member lookup)
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow anyway)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------
-- subscriptions RLS policies
-- --------------------------------------------

-- Users can view subscriptions they own OR are members of
CREATE POLICY "Users can view owned or member subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.user_subscriptions
            WHERE user_subscriptions.subscription_id = subscriptions.id
            AND user_subscriptions.subscriber_user_id = auth.uid()
            AND user_subscriptions.is_active = TRUE
        )
    );

-- Users can insert subscriptions (become owner)
CREATE POLICY "Users can create subscriptions"
    ON public.subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can update subscriptions they own
CREATE POLICY "Users can update own subscriptions"
    ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Users can delete subscriptions they own
CREATE POLICY "Users can delete own subscriptions"
    ON public.subscriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- --------------------------------------------
-- user_subscriptions RLS policies
-- --------------------------------------------

-- Users can view memberships in their subscriptions OR their own memberships
CREATE POLICY "Users can view relevant user_subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        -- User is the member
        auth.uid() = subscriber_user_id
        OR 
        -- User owns the subscription
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = user_subscriptions.subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can add members
CREATE POLICY "Subscription owners can add members"
    ON public.user_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = user_subscriptions.subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can update memberships
CREATE POLICY "Subscription owners can update memberships"
    ON public.user_subscriptions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = user_subscriptions.subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = user_subscriptions.subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can delete memberships
CREATE POLICY "Subscription owners can delete memberships"
    ON public.user_subscriptions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = user_subscriptions.subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- --------------------------------------------
-- payments RLS policies
-- --------------------------------------------

-- Users can view payments for subscriptions they own OR payments for their own memberships
CREATE POLICY "Users can view relevant payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        -- Payment is for user's own membership
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND user_subscriptions.subscriber_user_id = auth.uid()
        )
        OR
        -- User owns the subscription
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can create payments
CREATE POLICY "Subscription owners can create payments"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can update payments
CREATE POLICY "Subscription owners can update payments"
    ON public.payments
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only subscription owners can delete payments
CREATE POLICY "Subscription owners can delete payments"
    ON public.payments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = payments.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- --------------------------------------------
-- invoices RLS policies
-- --------------------------------------------

-- Users can view invoices they created OR invoices issued to them
CREATE POLICY "Users can view relevant invoices"
    ON public.invoices
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by
        OR auth.uid() = issued_to_user_id
    );

-- Only subscription owners can create invoices
CREATE POLICY "Subscription owners can create invoices"
    ON public.invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            JOIN public.subscriptions ON subscriptions.id = user_subscriptions.subscription_id
            WHERE user_subscriptions.id = invoices.user_subscription_id
            AND subscriptions.created_by = auth.uid()
        )
    );

-- Only invoice creators can update invoices
CREATE POLICY "Invoice creators can update invoices"
    ON public.invoices
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Only invoice creators can delete invoices
CREATE POLICY "Invoice creators can delete invoices"
    ON public.invoices
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- DATABASE FUNCTIONS (RPC)
-- ============================================

-- --------------------------------------------
-- Function: get_my_subscriptions
-- --------------------------------------------
-- Returns subscriptions where user is the owner

CREATE OR REPLACE FUNCTION public.get_my_subscriptions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    icon TEXT,
    description TEXT,
    total_amount DECIMAL,
    payment_type payment_type,
    total_members INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    member_count BIGINT,
    total_pending DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.icon,
        s.description,
        s.total_amount,
        s.payment_type,
        s.total_members,
        s.is_active,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT us.id) AS member_count,
        COALESCE(SUM(CASE WHEN p.is_paid = FALSE THEN p.amount ELSE 0 END), 0) AS total_pending
    FROM public.subscriptions s
    LEFT JOIN public.user_subscriptions us ON us.subscription_id = s.id AND us.is_active = TRUE
    LEFT JOIN public.payments p ON p.user_subscription_id = us.id
    WHERE s.created_by = p_user_id
    GROUP BY s.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- Function: get_subscribed_subscriptions
-- --------------------------------------------
-- Returns subscriptions where user is a member

CREATE OR REPLACE FUNCTION public.get_subscribed_subscriptions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    icon TEXT,
    description TEXT,
    my_amount DECIMAL,
    owner_name TEXT,
    owner_email TEXT,
    is_paid BOOLEAN,
    last_payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.icon,
        s.description,
        us.amount AS my_amount,
        prof.full_name AS owner_name,
        au.email AS owner_email,
        COALESCE(MAX(p.is_paid) FILTER (WHERE p.expiry_date >= NOW()), FALSE) AS is_paid,
        MAX(p.paid_on) AS last_payment_date,
        us.created_at
    FROM public.user_subscriptions us
    JOIN public.subscriptions s ON s.id = us.subscription_id
    JOIN public.profiles prof ON prof.id = s.created_by
    JOIN auth.users au ON au.id = s.created_by
    LEFT JOIN public.payments p ON p.user_subscription_id = us.id
    WHERE us.subscriber_user_id = p_user_id
    AND us.is_active = TRUE
    AND s.is_active = TRUE
    GROUP BY s.id, s.name, s.icon, s.description, us.amount, prof.full_name, au.email, us.created_at
    ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- Function: get_accumulated_pending
-- --------------------------------------------
-- Returns accumulated unpaid amounts per member for a subscription

CREATE OR REPLACE FUNCTION public.get_accumulated_pending(p_subscription_id UUID)
RETURNS TABLE (
    member_id UUID,
    member_name TEXT,
    member_email TEXT,
    member_phone TEXT,
    months_unpaid TEXT,
    total_accumulated DECIMAL,
    payment_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.subscriber_user_id AS member_id,
        prof.full_name AS member_name,
        au.email AS member_email,
        prof.phone_number AS member_phone,
        STRING_AGG(TO_CHAR(p.expiry_date, 'Mon YYYY'), ', ' ORDER BY p.expiry_date) AS months_unpaid,
        SUM(p.amount) AS total_accumulated,
        ARRAY_AGG(p.id ORDER BY p.expiry_date) AS payment_ids
    FROM public.user_subscriptions us
    JOIN public.profiles prof ON prof.id = us.subscriber_user_id
    JOIN auth.users au ON au.id = us.subscriber_user_id
    JOIN public.payments p ON p.user_subscription_id = us.id
    WHERE us.subscription_id = p_subscription_id
    AND us.is_active = TRUE
    AND p.is_paid = FALSE
    GROUP BY us.subscriber_user_id, prof.full_name, au.email, prof.phone_number
    HAVING SUM(p.amount) > 0
    ORDER BY total_accumulated DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- Function: get_accumulated_pending_by_owner
-- --------------------------------------------
-- Returns accumulated pending across all owned subscriptions

CREATE OR REPLACE FUNCTION public.get_accumulated_pending_by_owner(p_owner_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    subscription_name TEXT,
    member_id UUID,
    member_name TEXT,
    member_email TEXT,
    member_phone TEXT,
    months_unpaid TEXT,
    total_accumulated DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS subscription_id,
        s.name AS subscription_name,
        us.subscriber_user_id AS member_id,
        prof.full_name AS member_name,
        au.email AS member_email,
        prof.phone_number AS member_phone,
        STRING_AGG(TO_CHAR(p.expiry_date, 'Mon YYYY'), ', ' ORDER BY p.expiry_date) AS months_unpaid,
        SUM(p.amount) AS total_accumulated
    FROM public.subscriptions s
    JOIN public.user_subscriptions us ON us.subscription_id = s.id
    JOIN public.profiles prof ON prof.id = us.subscriber_user_id
    JOIN auth.users au ON au.id = us.subscriber_user_id
    JOIN public.payments p ON p.user_subscription_id = us.id
    WHERE s.created_by = p_owner_id
    AND s.is_active = TRUE
    AND us.is_active = TRUE
    AND p.is_paid = FALSE
    GROUP BY s.id, s.name, us.subscriber_user_id, prof.full_name, au.email, prof.phone_number
    HAVING SUM(p.amount) > 0
    ORDER BY s.name, total_accumulated DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- Function: get_subscription_details
-- --------------------------------------------
-- Returns full subscription details with members and payment status

CREATE OR REPLACE FUNCTION public.get_subscription_details(p_subscription_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    subscription_name TEXT,
    subscription_icon TEXT,
    subscription_description TEXT,
    total_amount DECIMAL,
    payment_type payment_type,
    owner_id UUID,
    owner_name TEXT,
    owner_email TEXT,
    member_id UUID,
    member_name TEXT,
    member_email TEXT,
    member_phone TEXT,
    member_amount DECIMAL,
    member_accumulated_pending DECIMAL,
    member_last_paid_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS subscription_id,
        s.name AS subscription_name,
        s.icon AS subscription_icon,
        s.description AS subscription_description,
        s.total_amount,
        s.payment_type,
        s.created_by AS owner_id,
        owner_prof.full_name AS owner_name,
        owner_user.email AS owner_email,
        us.subscriber_user_id AS member_id,
        member_prof.full_name AS member_name,
        member_user.email AS member_email,
        member_prof.phone_number AS member_phone,
        us.amount AS member_amount,
        COALESCE(SUM(p.amount) FILTER (WHERE p.is_paid = FALSE), 0) AS member_accumulated_pending,
        MAX(p.paid_on) AS member_last_paid_date
    FROM public.subscriptions s
    JOIN public.profiles owner_prof ON owner_prof.id = s.created_by
    JOIN auth.users owner_user ON owner_user.id = s.created_by
    LEFT JOIN public.user_subscriptions us ON us.subscription_id = s.id AND us.is_active = TRUE
    LEFT JOIN public.profiles member_prof ON member_prof.id = us.subscriber_user_id
    LEFT JOIN auth.users member_user ON member_user.id = us.subscriber_user_id
    LEFT JOIN public.payments p ON p.user_subscription_id = us.id
    WHERE s.id = p_subscription_id
    GROUP BY 
        s.id, s.name, s.icon, s.description, s.total_amount, s.payment_type,
        s.created_by, owner_prof.full_name, owner_user.email,
        us.subscriber_user_id, us.amount, member_prof.full_name, 
        member_user.email, member_prof.phone_number
    ORDER BY member_prof.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing
-- Note: Replace UUIDs with actual user IDs from auth.users after user registration

/*
-- Sample subscription
INSERT INTO public.subscriptions (name, icon, description, total_amount, payment_type, total_members, created_by)
VALUES ('Netflix Premium', '🎬', '4K streaming with 4 screens', 19.99, 'equal', 4, '<owner-user-id>');

-- Sample members
INSERT INTO public.user_subscriptions (subscription_id, subscriber_user_id, amount, expiry_date)
VALUES 
('<subscription-id>', '<member-1-id>', 5.00, NOW() + INTERVAL '1 month'),
('<subscription-id>', '<member-2-id>', 5.00, NOW() + INTERVAL '1 month'),
('<subscription-id>', '<member-3-id>', 5.00, NOW() + INTERVAL '1 month'),
('<subscription-id>', '<member-4-id>', 5.00, NOW() + INTERVAL '1 month');

-- Sample payments
INSERT INTO public.payments (user_subscription_id, amount, is_paid, expiry_date, created_by)
SELECT id, amount, FALSE, expiry_date, '<owner-user-id>'
FROM public.user_subscriptions
WHERE subscription_id = '<subscription-id>';
*/

-- ============================================
-- CLEANUP (Use with caution - drops all data)
-- ============================================

-- Uncomment to drop all tables and start fresh
-- WARNING: This will delete all data!

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_subscription_details(UUID);
DROP FUNCTION IF EXISTS public.get_accumulated_pending_by_owner(UUID);
DROP FUNCTION IF EXISTS public.get_accumulated_pending(UUID);
DROP FUNCTION IF EXISTS public.get_subscribed_subscriptions(UUID);
DROP FUNCTION IF EXISTS public.get_my_subscriptions(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS invoice_status;
DROP TYPE IF EXISTS payment_type;
*/

-- ============================================
-- END OF SCHEMA
-- ============================================

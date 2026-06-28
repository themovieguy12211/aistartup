-- SonixAI Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  credits FLOAT DEFAULT 0.0,          -- purchased credits (no signup bonus)
  role TEXT DEFAULT 'user',           -- 'user' or 'admin'
  daily_tokens_used INTEGER DEFAULT 0,
  daily_tokens_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  prefix TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Usage Records
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost FLOAT DEFAULT 0,
  api_key_id UUID REFERENCES public.api_keys(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New Chat',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  public_id UUID DEFAULT gen_random_uuid() UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost FLOAT DEFAULT 0,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 0.0, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(hash);
CREATE INDEX IF NOT EXISTS idx_usage_records_user ON public.usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- ==========================================
-- Row Level Security
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prevent users from modifying their own credits
-- Only the service_role (backend API) can change credit balances
CREATE OR REPLACE FUNCTION public.prevent_credit_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credits != OLD.credits AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Credits can only be modified by the API.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_credit_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_credit_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_credit_self_update();

-- Prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Role can only be changed by an admin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_update();

-- API Keys: users can CRUD their own keys
CREATE POLICY "Users can read own keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Records: users can read their own
CREATE POLICY "Users can read own usage" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own usage" ON public.usage_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations: users can CRUD their own
CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: users can read/create their own
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin bypass: service role ignores RLS (used in admin API routes)
-- No policy needed — server-side code uses createServiceSupabase() for admin ops

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.conversations;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- User Memories
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT DEFAULT 'auto', -- 'auto' or 'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON public.user_memories(user_id);
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own memories" ON public.user_memories
  FOR ALL USING (auth.uid() = user_id);

-- Daily free tokens (migration for existing databases)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_tokens_used INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_tokens_date DATE DEFAULT CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_profiles_daily_date ON public.profiles(daily_tokens_date);

-- Password reset tokens (bypasses gotrue's broken self-hosted config)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON public.password_reset_tokens(user_id);

-- Atomic daily token increment (prevents race conditions on concurrent requests)
CREATE OR REPLACE FUNCTION public.consume_daily_tokens(
  p_user_id UUID,
  p_tokens INTEGER,
  p_today DATE
)
RETURNS INTEGER AS $$
DECLARE
  current_used INTEGER;
  current_date DATE;
  free_granted INTEGER;
BEGIN
  SELECT daily_tokens_used, daily_tokens_date INTO current_used, current_date
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- Reset if new day
  IF current_date IS NULL OR current_date != p_today THEN
    current_used := 0;
  END IF;

  -- Grant as many free tokens as available
  free_granted := LEAST(p_tokens, GREATEST(0, 50000 - current_used));

  UPDATE public.profiles
  SET daily_tokens_used = current_used + free_granted,
      daily_tokens_date = p_today
  WHERE id = p_user_id;

  RETURN free_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stripe charges (idempotency tracking)
CREATE TABLE IF NOT EXISTS public.stripe_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

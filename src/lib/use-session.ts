"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface SessionData {
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    image?: string | null;
  } | null;
}

export function useSession() {
  const supabase = createClient();
  const [data, setData] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  async function loadUser(user: User | null) {
    if (!user) {
      setData(null);
      setStatus("unauthenticated");
      return;
    }

    // Fetch role from profiles table
    let role = "user";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) role = profile.role;
    } catch {}

    setData({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        role,
        image: null,
      },
    });
    setStatus("authenticated");
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => loadUser(session?.user || null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { data, status };
}

export function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export { createClient };

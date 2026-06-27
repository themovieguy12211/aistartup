"use client";

import { useEffect, useState, useRef } from "react";
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
  const timedOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    timedOutRef.current = false;

    async function loadUser(user: User | null) {
      if (!user) {
        setData(null);
        setStatus("unauthenticated");
        return;
      }

      let role = "user";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) role = profile.role;
      } catch {}

      if (cancelled || timedOutRef.current) return;

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

    const timeout = setTimeout(() => {
      if (!cancelled) {
        timedOutRef.current = true;
        setData(null);
        setStatus("unauthenticated");
      }
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await loadUser(session?.user || null);
      if (!cancelled) clearTimeout(timeout);
    }).catch(() => {
      if (!cancelled) {
        clearTimeout(timeout);
        setData(null);
        setStatus("unauthenticated");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!cancelled) loadUser(session?.user || null);
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { data, status };
}

export function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export { createClient };

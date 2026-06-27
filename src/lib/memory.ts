// User memory system — persists facts across conversations
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";

export interface Memory {
  id: string;
  key: string;
  value: string;
  source: string;
  created_at: string;
}

// Get all memories for a user
export async function getUserMemories(userId: string): Promise<Memory[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("user_memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Save or update a memory
export async function saveMemory(userId: string, key: string, value: string) {
  const supabase = await createServerSupabase();
  await supabase.from("user_memories").upsert({
    user_id: userId,
    key,
    value,
    source: "auto",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,key" });
}

// Delete a memory
export async function deleteMemory(memoryId: string, userId: string) {
  const supabase = await createServerSupabase();
  await supabase.from("user_memories").delete().eq("id", memoryId).eq("user_id", userId);
}

// Build memory context to inject into chat
export async function buildMemoryContext(userId: string): Promise<string> {
  const memories = await getUserMemories(userId);
  if (!memories.length) return "";

  const lines = memories.map((m) => `- ${m.key}: ${m.value}`);
  return `\n\n[User profile (from memory):\n${lines.join("\n")}\n]\n\nUse this context to personalize your responses. Reference it naturally when relevant.`;
}

// Auto-extract memories from conversation using simple heuristics
export function extractMemories(userMessage: string, assistantResponse: string): { key: string; value: string }[] {
  const facts: { key: string; value: string }[] = [];

  // Pattern: "I am a X" or "I'm a X"
  const roleMatch = userMessage.match(/\b(?:I am|I'm)\s+(?:a|an)\s+(.+?)(?:[.,!]|$)/i);
  if (roleMatch) facts.push({ key: "Role", value: roleMatch[1].trim() });

  // Pattern: "I use X" or "I'm using X" (tech/framework)
  const techMatch = userMessage.match(/\b(?:I (?:use|code in|work with)|I'm (?:using|building with|working with))\s+(.+?)(?:[.,!]|$)/i);
  if (techMatch) facts.push({ key: "Tech stack", value: techMatch[1].trim() });

  // Pattern: "my name is X" or "call me X"
  const nameMatch = userMessage.match(/\b(?:my name is|call me|I'm) ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  if (nameMatch) facts.push({ key: "Name", value: nameMatch[1].trim() });

  // Pattern: "I prefer X" or "I like X" or "I want X"
  const prefMatch = userMessage.match(/\b(?:I (?:prefer|like|want|need|hate|dislike))\s+(.+?)(?:[.,!]|$)/i);
  if (prefMatch) facts.push({ key: "Preference", value: prefMatch[1].trim() });

  // Pattern: "I'm building X" or "I'm working on X"
  const projectMatch = userMessage.match(/\b(?:I(?:'m| am) (?:building|working on|creating|making|developing))\s+(?:a|an|the)?\s*(.+?)(?:[.,!]|$)/i);
  if (projectMatch) facts.push({ key: "Project", value: projectMatch[1].trim() });

  // Pattern: user says "I work at X" or "I work for X"
  const workMatch = userMessage.match(/\b(?:I work (?:at|for))\s+(.+?)(?:[.,!]|$)/i);
  if (workMatch) facts.push({ key: "Company", value: workMatch[1].trim() });

  return facts;
}

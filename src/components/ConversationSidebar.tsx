"use client";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onShare,
}: Props) {
  return (
    <div
      className="d-flex flex-column p-2"
      style={{
        width: "260px",
        flexShrink: 0,
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
      }}
    >
      {/* New chat button */}
      <button
        onClick={onNew}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontSize: "0.85rem",
          borderRadius: "6px",
          padding: "6px 12px",
          cursor: "pointer",
          width: "100%",
          marginBottom: "8px",
        }}
      >
        + New Chat
      </button>

      {/* Conversation list */}
      <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
        {conversations.length === 0 && (
          <div
            className="text-center mt-4 px-2"
            style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}
          >
            No conversations yet
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="d-flex align-items-center p-2 rounded mb-1 conversation-row"
            style={{
              cursor: "pointer",
              background: activeId === conv.id ? "var(--bg-elevated)" : "transparent",
              border: activeId === conv.id ? "1px solid var(--border)" : "1px solid transparent",
              transition: "background 0.1s",
            }}
          >
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: activeId === conv.id ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {conv.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {conv._count?.messages ?? 0} msgs · {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(conv.id); }}
                className="conversation-delete-btn"
                title="Share"
                style={{
                  background: "none", border: "none",
                  color: "var(--text-muted)", fontSize: "0.8rem",
                  cursor: "pointer", padding: "2px 6px", borderRadius: "4px",
                }}
              >
                ↗
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this conversation?")) onDelete(conv.id);
              }}
              className="conversation-delete-btn"
              title="Delete"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                cursor: "pointer",
                padding: "2px 8px",
                borderRadius: "4px",
                marginLeft: "4px",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div
      className="d-flex flex-column p-2"
      style={{
        width: "260px",
        flexShrink: 0,
        background: "rgba(0,0,0,0.3)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* New chat button */}
      <button
        onClick={onNew}
        className="btn btn-sm w-100 mb-2 text-start"
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e",
          fontSize: "0.8rem",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        $ new --chat
      </button>

      {/* Conversation list */}
      <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
        {conversations.length === 0 && (
          <div
            className="text-center mt-3 px-2"
            style={{
              color: "rgba(255,255,255,0.15)",
              fontSize: "0.7rem",
            }}
          >
            No conversations yet
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="d-flex align-items-center p-2 rounded mb-1"
            style={{
              cursor: "pointer",
              background:
                activeId === conv.id
                  ? "rgba(139, 92, 246, 0.12)"
                  : "transparent",
              border:
                activeId === conv.id
                  ? "1px solid rgba(139, 92, 246, 0.2)"
                  : "1px solid transparent",
              transition: "all 0.1s",
            }}
          >
            <span
              style={{
                color:
                  activeId === conv.id
                    ? "var(--brand-purple)"
                    : "rgba(255,255,255,0.3)",
                marginRight: "6px",
                fontSize: "0.7rem",
                flexShrink: 0,
              }}
            >
              {activeId === conv.id ? ">" : "$"}
            </span>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color:
                    activeId === conv.id
                      ? "#e4e4e7"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                {conv.title}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                {conv._count?.messages ?? 0} msgs ·{" "}
                {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("rm this conversation?")) onDelete(conv.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.15)",
                fontSize: "0.7rem",
                cursor: "pointer",
                padding: "2px 4px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="rm"
            >
              rm
            </button>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div
        className="pt-2"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.12)",
          textAlign: "center",
        }}
      >
        $ new --chat · rm to delete
      </div>
    </div>
  );
}

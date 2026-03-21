"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";

interface VoteButtonProps {
  targetType: "FINDING" | "COMMENT";
  targetId: string;
  initialVotesCount: number;
  initialUserVoted: boolean;
  isOwner: boolean;
  /**
   * "card"    — compact square icon button (community feed)
   * "detail"  — wider button with label (finding detail actions row)
   * "comment" — small inline heart + count (comment section)
   */
  variant?: "card" | "detail" | "comment";
}

export default function VoteButton({
  targetType,
  targetId,
  initialVotesCount,
  initialUserVoted,
  isOwner,
  variant = "card",
}: VoteButtonProps) {
  const { data: session } = useSession();
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [userVoted, setUserVoted] = useState(initialUserVoted);
  const [loading, setLoading] = useState(false);

  const canVote = !!session?.user?.id && !isOwner;

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canVote || loading) return;
    setLoading(true);
    const wasVoted = userVoted;
    setUserVoted(!wasVoted);
    setVotesCount((c) => c + (wasVoted ? -1 : 1));
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotesCount(data.votesCount);
        setUserVoted(data.voted);
      } else {
        setUserVoted(wasVoted);
        setVotesCount((c) => c + (wasVoted ? 1 : -1));
      }
    } catch {
      setUserVoted(wasVoted);
      setVotesCount((c) => c + (wasVoted ? 1 : -1));
    } finally {
      setLoading(false);
    }
  };

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={!canVote || loading}
        title={
          isOwner
            ? "Eigene Funde können nicht bewertet werden"
            : userVoted
              ? "Vote entfernen"
              : "Vote"
        }
        className={`inline-flex items-center gap-2 px-3 h-8 rounded-md border-2 text-[14px] font-bold transition-all duration-150 ease-in-out select-none ${
          userVoted
            ? "border-red-400 text-red-500 hover:bg-red-50"
            : isOwner
              ? "border-black/10 text-muted-foreground/40 cursor-default"
              : "border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d]"
        }`}
      >
        <Heart
          className="h-4 w-4 shrink-0"
          strokeWidth={userVoted ? 0 : 2}
          fill={userVoted ? "currentColor" : "none"}
        />
        <span>
          {votesCount > 0
            ? `${votesCount} ${votesCount === 1 ? "Vote" : "Votes"}`
            : "Vote"}
        </span>
      </button>
    );
  }

  if (variant === "comment") {
    // Subtle inline button: just a heart + count, no border box
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={!canVote || loading}
        title={
          isOwner
            ? "Eigene Kommentare können nicht bewertet werden"
            : userVoted
              ? "Vote entfernen"
              : "Kommentar bewerten"
        }
        className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors select-none rounded px-1 py-0.5 ${
          userVoted
            ? "text-red-500 hover:text-red-400"
            : canVote
              ? "text-muted-foreground/50 hover:text-red-400"
              : "text-muted-foreground/30 cursor-default"
        }`}
      >
        <Heart
          className="h-3 w-3 shrink-0"
          strokeWidth={userVoted ? 0 : 1.5}
          fill={userVoted ? "currentColor" : "none"}
        />
        {votesCount > 0 && <span>{votesCount}</span>}
      </button>
    );
  }

  // variant === "card"
  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={!canVote || loading}
      title={
        isOwner
          ? "Eigene Funde können nicht bewertet werden"
          : userVoted
            ? "Vote entfernen"
            : "Vote"
      }
      className={`flex items-center justify-center h-8 w-8 rounded-lg border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95] relative ${
        userVoted
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0]"
      }`}
    >
      <Heart
        className="h-[17px] w-[17px]"
        strokeWidth={userVoted ? 0 : 1.2}
        fill={userVoted ? "currentColor" : "none"}
      />
      {votesCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
          {votesCount > 9 ? "9+" : votesCount}
        </span>
      )}
    </button>
  );
}

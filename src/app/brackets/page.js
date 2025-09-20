"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function BracketsPage() {
  const [matches, setMatches] = useState({ QF: [], SF: [], F: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      const stages = ["QF", "SF", "F"];
      const data = { QF: [], SF: [], F: [] };

      for (const stage of stages) {
        const q = query(collection(db, "matches"), orderBy("createdAt", "asc"));
        const snap = await getDocs(q);
        data[stage] = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.stage === stage);
      }

      setMatches(data);
      setLoading(false);
    }
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold text-[#161B3B]">
        Loading brackets...
      </div>
    );
  }

  // Determine the final winner if finals exist and completed
  const finalMatch = matches.F[0];
  const finalWinner =
    finalMatch?.status === "completed"
      ? finalMatch.winner === finalMatch.teamA?.id
        ? finalMatch.teamA?.name
        : finalMatch.teamB?.name
      : null;

  return (
    <div className="min-h-screen bg-[#E3DFD3] p-6 relative">
      <h1 className="text-3xl md:text-5xl font-extrabold text-[#161B3B] text-center mb-8">
        Resolution Rally Playoffs
      </h1>

      {/* Central vertical line */}
      <div className="absolute left-1/2 top-36 bottom-8 w-0.5 bg-[#B0AC9E] -translate-x-1/2"></div>

      <div className="flex flex-col items-center gap-16">
        <BracketStage title="Quarterfinals" matches={matches.QF} offset="left" />
        <BracketStage title="Semifinals" matches={matches.SF} offset="right" />
        <BracketStage title="Final" matches={matches.F} offset="left" />

        {/* Final Winner Card */}
        {finalWinner && (
          <div className="w-64 bg-[#96A086] text-white font-bold rounded-xl p-6 text-center shadow-lg">
            🏆 Champions: {finalWinner}
          </div>
        )}
      </div>
    </div>
  );
}

function BracketStage({ title, matches, offset }) {
  return (
    <div className="flex flex-col w-full relative">
      <span
        className={`w-fit p-6 rounded-2xl shadow-lg bg-[#D9D7C4] ${
          offset === "left" ? "ml-auto" : "mr-auto"
        }`}
      >
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[#161B3B]">{title}</h2>

        <div className="flex flex-col items-center gap-6 w-full">
          {matches.length === 0 &&
            Array.from({
              length:
                2 **
                (3 - (title === "Final" ? 2 : title === "Semifinals" ? 1 : 0)),
            }).map((_, i) => <MatchBox key={i} match={null} offset={offset} />)}

          {matches.map((match, i) => (
            <MatchBox key={match?.id || i} match={match} offset={offset} />
          ))}
        </div>
      </span>
    </div>
  );
}

function MatchBox({ match, offset }) {
  const positionClass = offset === "left" ? "ml-auto" : "mr-auto";

  if (!match) {
    return (
      <div
        className={`w-64 bg-[#E3DFD3] rounded-xl p-3 text-center text-[#444E5F] mb-4 border border-[#B0AC9E] ${positionClass}`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`w-64 rounded-xl shadow-md p-3 mb-4 border border-[#B0AC9E] ${positionClass} bg-[#D9D7C4]`}
    >
      <div
        className={`p-2 rounded-lg mb-1 flex justify-between ${
          match.winner === match.teamA?.id
            ? "bg-[#96A086] font-bold text-white"
            : ""
        }`}
      >
        <span>{match.teamA?.name || "TBD"}</span>
        <span className="font-semibold">{match.teamA?.totalScore || 0}</span>
      </div>

      <div
        className={`p-2 rounded-lg flex justify-between ${
          match.winner === match.teamB?.id
            ? "bg-[#96A086] font-bold text-white"
            : ""
        }`}
      >
        <span>{match.teamB?.name || "TBD"}</span>
        <span className="font-semibold">{match.teamB?.totalScore || 0}</span>
      </div>

      <p className="text-xs text-[#444E5F] mt-1">
        {match?.status === "completed"
          ? `Winner: ${
              match.winner === match.teamA?.id
                ? match.teamA?.name
                : match.teamB?.name
            }`
          : "Scheduled"}
      </p>
    </div>
  );
}

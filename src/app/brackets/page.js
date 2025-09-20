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
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Loading brackets...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-10">Tournament Bracket</h1>

      <div className="flex justify-center gap-12 overflow-x-auto">
        <BracketColumn title="Quarterfinals" matches={matches.QF} totalSlots={4} />
        <BracketColumn title="Semifinals" matches={matches.SF} totalSlots={2} />
        <BracketColumn title="Final" matches={matches.F} totalSlots={1} />
      </div>
    </div>
  );
}

function BracketColumn({ title, matches, totalSlots }) {
  return (
    <div className="flex flex-col items-center relative">
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      <div className="flex flex-col justify-around h-full space-y-8 relative">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const match = matches[i] || null;
          return (
            <div key={i} className="relative flex items-center">
              <MatchBox match={match} />
              {/* Connector line to next column */}
              <div className="absolute right-[-48px] top-1/2 w-12 border-t-2 border-gray-400"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchBox({ match }) {
  if (!match) {
    return (
      <div className="w-48 bg-gray-200 rounded-xl p-4 text-center text-gray-500">
        TBD
      </div>
    );
  }

  return (
    <div className="w-48 bg-white rounded-xl shadow p-4 text-center">
      <p className="text-xs text-gray-400 mb-2">{match.id}</p>
      <div
        className={`p-2 rounded-lg mb-2 ${
          match.winner === match.teamA?.id ? "bg-green-100 font-bold" : ""
        }`}
      >
        {match.teamA?.name || "TBD"} ({match.teamA?.totalScore})
      </div>
      <div
        className={`p-2 rounded-lg ${
          match.winner === match.teamB?.id ? "bg-green-100 font-bold" : ""
        }`}
      >
        {match.teamB?.name || "TBD"} ({match.teamB?.totalScore})
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {match.status === "completed"
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

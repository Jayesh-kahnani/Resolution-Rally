"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Phone, Mail } from "lucide-react";

export default function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRankings() {
    setLoading(true);
    try {
      const teamsSnap = await getDocs(collection(db, "teams"));
      const teams = teamsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort by totalScore descending
      const sorted = teams.sort((a, b) => b.totalScore - a.totalScore);

      setRankings(sorted);
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRankings();
  }, []);

  return (
    <div className="min-h-screen bg-[#E3DFD3] flex flex-col items-center p-6">
      {/* Top Section */}
      <div className="w-full max-w-5xl relative mb-1 h-40 md:h-48 lg:h-56">
  <h1 className="absolute top-25 left-1/20 transform -translate-y-1/2 text-3xl md:text-5xl font-extrabold text-[#161B3B] max-w-[60%] lg:max-w-[55%] whitespace-normal">
          Rankings
        </h1>

        {/* Mascot */}
        <img
          src="/mascot.png"
          alt="Mascot"
    className="absolute top-1/2 right-0 transform -translate-y-1/2 w-48 md:w-64 lg:w-80 h-auto object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Rankings Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full max-w-5xl mb-12">
        {loading ? (
          <p className="text-[#444E5F] text-center col-span-full">
            Loading rankings…
          </p>
        ) : rankings.length === 0 ? (
          <p className="text-[#444E5F] text-center col-span-full">
            No teams found.
          </p>
        ) : (
          rankings.map((team, idx) => {
            const isTop8 = idx < 8;
            return (
              <div
                key={team.id}
                className={`flex flex-col gap-2 p-5 rounded-xl border shadow-md hover:shadow-lg hover:scale-105 transition transform ${
                  isTop8
                    ? "bg-[#cec9a8] border-[#B0AC9E]"
                    : "bg-[#D9D7C4] border-[#B0AC9E]"
                }`}
              >
                <h2 className="text-lg font-semibold text-[#161B3B] flex justify-between">
                  <span className="max-w-[60%] truncate">
                    {idx + 1}. {team.name || "Unnamed Team"}
                  </span>
                  <span>({team.totalScore || 0})</span>
                </h2>

                <div className="text-sm text-[#444E5F] mt-1 flex justify-between">
                  <span>Matches: {team.matchesPlayed || 0}</span>
                  {isTop8 && (
                    <span className="bg-[#96A086] text-white px-2 py-1 rounded-full text-xs">
                      Playoffs
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Support Section */}
      <div className="w-full max-w-5xl p-6 rounded-2xl bg-[#444E5F] text-[#E3DFD3] shadow-lg mb-8">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
          <Phone className="w-5 h-5" /> Support
        </h2>
        <p className="text-[#96A086] text-sm mb-3">
          If you have any questions or need assistance, reach out to us:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> +91 9150833323
          </li>
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:debate.club@apu.edu.in"
              className="underline hover:text-[#96A086]"
            >
              debate.club@apu.edu.in
            </a>
          </li>
        </ul>
      </div>

      <p className="text-[#444E5F] text-xs mb-4 text-center">
        © 2025 Resolution Rally. All rights reserved.
      </p>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Users, Phone, Mail } from "lucide-react";

export default function Match1Page() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const q = query(collection(db, "matches"), where("day", "==", 1));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setMatches(data);
      } catch (err) {
        console.error("Error fetching match-1 data:", err);
      }
    }
    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-[#E3DFD3] flex flex-col items-center p-6">
      {/* Top Section */}
<div className="w-full max-w-5xl relative mb-1 h-40 md:h-48 lg:h-56">
  {/* Heading */}
  <h1 className="absolute top-23 left-1/20 transform -translate-y-1/2 text-3xl md:text-5xl font-extrabold text-[#161B3B] max-w-[60%] lg:max-w-[55%] whitespace-normal">
    Match 1 Pairings
  </h1>

  {/* Mascot */}
  <img
    src="/mascot.png"
    alt="Mascot"
    className="absolute top-1/2 right-0 transform -translate-y-1/2 w-48 md:w-64 lg:w-80 h-auto object-contain transition-transform duration-300 hover:scale-105"
  />
</div>
      {/* Matches Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full max-w-5xl mb-12">
        {matches.length > 0 ? (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-col gap-2 p-5 rounded-xl bg-[#D9D7C4] border border-[#B0AC9E] shadow-md hover:shadow-lg hover:scale-105 transition transform"
            >
              {/* Team A */}
              <h2 className="text-lg font-semibold text-[#161B3B] flex justify-between">
                <span className="max-w-[60%] truncate">
                  {match.teamA?.name || "TBD"}
                </span>
                <span>({match.teamA?.totalScore || 0})</span>
              </h2>

              {/* Divider */}
              <div className="border-t border-[#B0AC9E] my-2"></div>

              {/* Team B */}
              <h2 className="text-lg font-semibold text-[#161B3B] flex justify-between">
                <span className="max-w-[60%] truncate">
                  {match.teamB?.name || "TBD"}
                </span>
                <span>({match.teamB?.totalScore || 0})</span>
              </h2>
            </div>
          ))
        ) : (
          <p className="text-[#444E5F] text-center col-span-full">
            No matches scheduled yet.
          </p>
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

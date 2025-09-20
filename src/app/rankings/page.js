// src/app/rankings/page.js
"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

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

      // sort by totalScore descending, then wins if tie
      const sorted = teams.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.wins - a.wins;
      });

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
    <div className="max-w-6xl mx-auto mt-12 px-6 py-8 bg-white rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-800">Rankings</h1>
        <button
          onClick={fetchRankings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Refresh Rankings
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading rankings…</div>
      ) : rankings.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No teams found.</div>
      ) : (
        <>
          {/* Large screens: table view */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-semibold">
                  <th className="border px-4 py-2">#</th>
                  <th className="border px-4 py-2 text-left">Team</th>
                  <th className="border px-4 py-2">Total Score</th>
                  <th className="border px-4 py-2">Wins</th>
                  <th className="border px-4 py-2">Losses</th>
                  <th className="border px-4 py-2">Matches Played</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((t, idx) => {
                  const isTop8 = idx < 8;
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-gray-50 ${
                        isTop8 ? "bg-blue-50 font-medium" : "bg-white"
                      }`}
                    >
                      <td className="border px-4 py-2 text-center">{idx + 1}</td>
                      <td className="border px-4 py-2">{t.name || "Unnamed Team"}</td>
                      <td className="border px-4 py-2 text-center">{t.totalScore || 0}</td>
                      <td className="border px-4 py-2 text-center">{t.wins || 0}</td>
                      <td className="border px-4 py-2 text-center">{t.losses || 0}</td>
                      <td className="border px-4 py-2 text-center">{t.matchesPlayed || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Small screens: card view */}
          <div className="lg:hidden flex flex-col gap-4">
            {rankings.map((t, idx) => {
              const isTop8 = idx < 8;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl shadow hover:shadow-md transition border ${
                    isTop8
                      ? "bg-blue-50 border-blue-300 font-semibold"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">
                      {idx + 1}. {t.name || "Unnamed Team"}
                    </span>
                    {isTop8 && (
                      <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                        Playoff
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Score: {t.totalScore || 0}</span>
                    <span>Wins: {t.wins || 0}</span>
                    <span>Losses: {t.losses || 0}</span>
                    <span>Matches: {t.matchesPlayed || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Top 8 teams qualify for the playoffs. Rankings are based on "scores" not "matches won".
      </p>
    </div>
  );
}

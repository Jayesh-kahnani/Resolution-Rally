"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  // optionally fetch next match to display
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    // fetch upcoming match from Firestore // pseudo 
    // setNextMatch(...)
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#ff5757]">Resolution Rally 2025</h1>
        <nav className="flex gap-4 text-base">
          <Link href="/fixtures" className="hover:text-[#0097b2]">Fixtures</Link>
          <Link href="/playoffs" className="hover:text-[#0097b2]">Playoffs</Link>
          <Link href="/results" className="hover:text-[#0097b2]">Results</Link>
          <Link href="/rulebook" className="hover:text-[#0097b2]">Rulebook</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-16 flex-1">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-2">Resolution Rally</h2>
        <p className="text-xl text-gray-700 mb-1">September 26 & 27</p>
        <p className="text-lg text-gray-600 mb-6 text-center max-w-md">
          Azim Premji University’s flagship policy debate tournament
        </p>
        <Link href="/fixtures">
          <button className="bg-[#ff5757] text-white px-6 py-3 rounded-xl shadow hover:bg-[#e74c4c] transition">
            View Fixtures
          </button>
        </Link>
      </section>

      {/* Next Match or Notice */}
      <section className="px-6 py-8 w-full max-w-md mx-auto">
        {nextMatch ? (
          <div className="border rounded-xl px-4 py-6 shadow">
            <p className="text-gray-500 mb-2 text-sm">Next Match</p>
            <p className="font-semibold text-lg">{nextMatch.teamA} vs {nextMatch.teamB}</p>
            <p className="text-gray-700 text-sm mt-1">{nextMatch.dateTime}</p>
          </div>
        ) : (
          <div className="text-center text-gray-600">All matches completed. Stay tuned for results!</div>
        )}
      </section>

      {/* Format Overview */}
      <section className="px-6 py-10 bg-gray-50">
        <h3 className="text-2xl font-bold text-center mb-6">Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-xl mx-auto">
          {[
            { title: "The Case", desc: "Round 1: Ideological exposition" },
            { title: "The Evidence", desc: "Round 2: Policy proposals" },
            { title: "The Gavel", desc: "Round 3: Cross-examination" },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition">
              <h4 className="text-xl font-semibold text-[#0097b2] mb-2">{card.title}</h4>
              <p className="text-gray-600 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-6 py-6 w-full flex justify-center gap-4">
        <Link href="/fixtures" className="text-[#0097b2] underline">Fixtures</Link>
        <Link href="/playoffs" className="text-[#0097b2] underline">Playoffs Bracket</Link>
        <Link href="/results" className="text-[#0097b2] underline">Results</Link>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white text-center py-6 mt-auto">
        <p>📧 debateclub@apu.edu.in | 📞 +91 7550208248</p>
        <p className="mt-2 text-sm">© 2025 Resolution Rally</p>
      </footer>
    </div>
  );
}

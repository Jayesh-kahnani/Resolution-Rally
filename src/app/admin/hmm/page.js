"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { fetchTeamMembers, createRound } from "@/app/api/matches/route";

export default function FixMatch43() {
  const [teams, setTeams] = useState([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const snap = await getDocs(collection(db, "teams"));
      const teamList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(teamList);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }

  async function fixMatch43() {
    if (!teamAId || !teamBId) return alert("Select both teams");

    setLoading(true);
    try {
      const matchId = "match-4-3"; // 👈 updated here

      // Delete existing rounds
      const rSnap = await getDocs(collection(db, "matches", matchId, "rounds"));
      for (const r of rSnap.docs) {
        await deleteDoc(doc(db, "matches", matchId, "rounds", r.id));
      }

      // Fetch members for selected teams
      const teamAMembers = await fetchTeamMembers(teamAId).catch(() => []);
      const teamBMembers = await fetchTeamMembers(teamBId).catch(() => []);

      // Update match document
      await updateDoc(doc(db, "matches", matchId), {
        teamA: { id: teamAId, name: teams.find((t) => t.id === teamAId)?.name || "TBD" },
        teamB: { id: teamBId, name: teams.find((t) => t.id === teamBId)?.name || "TBD" },
      });

      // Recreate rounds
      await createRound(
        matchId,
        1,
        "round 1",
        teamAMembers.filter((m) => ["Speaker1", "Speaker2"].includes(m.role)),
        teamBMembers.filter((m) => ["Speaker1", "Speaker2"].includes(m.role))
      );

      await createRound(
        matchId,
        2,
        "round 2",
        teamAMembers.filter((m) => m.role === "Policy"),
        teamBMembers.filter((m) => m.role === "Policy")
      );

      await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

      alert("✅ Match-4-3 fixed successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error fixing match-4-3");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Fix Match-4-3</h2> {/* 👈 updated here */}
      <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
        <option value="">-- Select Team A --</option>
        {Array.isArray(teams) && teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
        <option value="">-- Select Team B --</option>
        {Array.isArray(teams) && teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <button onClick={fixMatch43} disabled={loading}>
        {loading ? "Fixing..." : "Fix Match-4-3"}
      </button>
    </div>
  );
}

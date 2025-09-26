"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { createRound, fetchTeamMembers } from "@/app/api/matches/route";

const ROUND_CRITERIA_MAX = {
  "round 1": { matter: 8, manner: 6, method: 6 },
  "round 2": { matter: 15, manner: 10, feasibilitycreativity: 10 },
  "round 3": { questions: 10, answers: 10, answertoadjudicator: 5 },
};

export default function Match2Page() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [savedRounds, setSavedRounds] = useState({});
  const [pairings, setPairings] = useState([{ teamA: "", teamB: "" }]);

  useEffect(() => {
    fetchTeams();
    fetchMatchesAndRounds();
  }, []);

  /** ---------------- Fetch Teams & Matches ---------------- **/
  async function fetchTeams() {
    const snap = await getDocs(collection(db, "teams"));
    setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function fetchMatchesAndRounds() {
    const snap = await getDocs(
      query(collection(db, "matches"), where("day", "==", 2))
    );
    const matchList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMatches(matchList);

    const roundsData = {};
    for (const match of matchList) {
      const rSnap = await getDocs(
        collection(db, "matches", match.id, "rounds")
      );
      const rDocs = rSnap.docs.map((r) => ({ id: r.id, ...r.data() }));
      rDocs.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
      roundsData[match.id] = rDocs;
    }
    setRounds(roundsData);
  }

  /** ---------------- Clear Match 2 ---------------- **/
  async function handleClearMatch() {
    if (!confirm("Clear Match 2 and rematchmake?")) return;
    setLoading(true);
    try {
      for (const match of matches) {
        const rSnap = await getDocs(
          collection(db, "matches", match.id, "rounds")
        );
        for (const r of rSnap.docs)
          await deleteDoc(doc(db, "matches", match.id, "rounds", r.id));
        await deleteDoc(doc(db, "matches", match.id));
      }
      setMatches([]);
      setRounds({});
      setMessage("✅ Match 2 cleared");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error clearing match");
    } finally {
      setLoading(false);
    }
  }

  /** ---------------- Handle Manual Pairings ---------------- **/
  function handlePairingChange(idx, field, value) {
    const newPairs = [...pairings];
    newPairs[idx][field] = value;
    setPairings(newPairs);
  }

  function handleAddPairing() {
    setPairings([...pairings, { teamA: "", teamB: "" }]);
  }

  function handleRemovePairing(idx) {
    setPairings(pairings.filter((_, i) => i !== idx));
  }

/** ---------------- Create Manual Matches ---------------- **/
async function handleCreateMatches() {
  if (pairings.length === 0) return alert("Add at least one pairing");

  setLoading(true);
  try {
    for (let i = 0; i < pairings.length; i++) {
      const { teamA: teamAId, teamB: teamBId } = pairings[i];
      if (!teamAId || !teamBId) continue;

      const matchId = `match-1-${i + 1}`; // dynamic match ID

      // Delete existing rounds if match already exists
      const matchDocRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchDocRef);
      if (matchSnap.exists()) {
        const rSnap = await getDocs(collection(db, "matches", matchId, "rounds"));
        for (const r of rSnap.docs) {
          await deleteDoc(doc(db, "matches", matchId, "rounds", r.id));
        }
      }

      const teamAMembers = await fetchTeamMembers(teamAId).catch(() => []);
      const teamBMembers = await fetchTeamMembers(teamBId).catch(() => []);

      // Create or overwrite match document
      await setDoc(matchDocRef, {
        day: 2,
        round: "Match 2",
        status: "scheduled",
        teamA: {
          id: teamAId,
          name: teams.find((t) => t.id === teamAId)?.name || "TBD",
        },
        teamB: {
          id: teamBId,
          name: teams.find((t) => t.id === teamBId)?.name || "TBD",
        },
        winner: null,
        loser: null,
        createdAt: new Date(),
      });

      // Create rounds
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
    }

    setMessage("✅ Manual Match 1 generated without duplication!");
    fetchMatchesAndRounds();
  } catch (err) {
    console.error(err);
    setMessage("❌ Error creating manual matches");
  } finally {
    setLoading(false);
  }
}
  /** ---------------- Compute Team Total ---------------- **/
  function computeTeamTotal(matchId, teamKey) {
    const rList = rounds[matchId] || [];
    let total = 0;
    for (const r of rList) {
      if (r.roundNumber === 3) {
        const teamScores = r.scores?.[teamKey] || {};
        total += Object.values(teamScores).reduce(
          (s, v) => s + Number(v || 0),
          0
        );
      } else {
        const teamScores = r.scores?.[teamKey] || {};
        for (const p of Object.values(teamScores)) {
          total += Object.entries(p)
            .filter(
              ([k]) =>
                ![
                  "id",
                  "name",
                  "role",
                  "teamId",
                  "rootId",
                  "totalScore",
                ].includes(k)
            )
            .reduce((s, [_, v]) => s + Number(v || 0), 0);
        }
      }
    }
    return total;
  }

  /** ---------------- UI ---------------- **/
  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-gray-50 rounded-xl shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 tracking-tight">
        Match 2 - Manual Pairing
      </h1>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Add Pairings</h2>
        {pairings.map((p, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <select
              value={p.teamA}
              onChange={(e) =>
                handlePairingChange(idx, "teamA", e.target.value)
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Select Team A</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="font-bold">vs</span>
            <select
              value={p.teamB}
              onChange={(e) =>
                handlePairingChange(idx, "teamB", e.target.value)
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Select Team B</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleRemovePairing(idx)}
              className="text-red-600 font-bold px-2"
            >
              X
            </button>
          </div>
        ))}
        <button
          onClick={handleAddPairing}
          className="bg-blue-600 text-white px-4 py-1 rounded mt-2"
        >
          Add Pairing
        </button>
        <button
          onClick={handleCreateMatches}
          className="bg-green-600 text-white px-4 py-1 rounded ml-2"
        >
          Create Matches
        </button>
      </div>

      <button
        onClick={handleClearMatch}
        disabled={loading || matches.length === 0}
        className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition disabled:opacity-50 mb-6"
      >
        Clear Match 1
      </button>

      {/* Display Matches */}
      {matches.map((match) => {
        const totalA = computeTeamTotal(match.id, "teamA");
        const totalB = computeTeamTotal(match.id, "teamB");

        return (
          <div
            key={match.id}
            className="bg-white border rounded-lg p-6 mb-6 shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
              <span>
                {match.teamA?.name} vs {match.teamB?.name}
              </span>
              <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                {match.status}
              </span>
            </h2>

            {/* Render rounds & scores here (similar to your previous code) */}
            {/* ... omitted for brevity, you can reuse your existing rounds table logic ... */}
          </div>
        );
      })}
    </div>
  );
}

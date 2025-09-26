// src/app/admin/matches/match-1/page.js
"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { generateMatch1 } from "@/app/api/matches/route";

const ROUND_CRITERIA_MAX = {

  "round 1": { matter: 8, manner: 6, method: 6 },
  "round 2": { matter: 15, manner: 10, feasibilitycreativity: 10 },
  "round 3": { questions: 10, answers: 10, answertoadjudicator: 5 },
};

export default function Match1Page() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [savedRounds, setSavedRounds] = useState({});

  useEffect(() => {
    fetchTeams();
    fetchMatchesAndRounds();
  }, []);

  // Compute total score for a team across all rounds
  function computeTeamTotal(matchId, teamKey) {
    const rList = rounds[matchId] || [];
    let total = 0;

    for (const r of rList) {
      if (r.roundNumber === 3) {
        // team-level
        const teamScores = r.scores?.[teamKey] || {};
        total += Object.values(teamScores).reduce((s, v) => s + Number(v || 0), 0);
      } else {
        // participant-level
        const teamScores = r.scores?.[teamKey] || {};
        for (const p of Object.values(teamScores)) {
          total += Object.entries(p)
            .filter(([k]) => !["id","name","role","teamId","rootId","totalScore"].includes(k))
            .reduce((s, [_, v]) => s + Number(v || 0), 0);
        }
      }
    }

    return total;
  }

  /** ---------------- Fetch Teams & Matches ---------------- **/
  async function fetchTeams() {
    const snap = await getDocs(collection(db, "teams"));
    setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function fetchMatchesAndRounds() {
    const snap = await getDocs(query(collection(db, "matches"), where("day", "==", 1)));
    const matchList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMatches(matchList);

    // fetch rounds for each match
    const roundsData = {};
    for (const match of matchList) {
      const rSnap = await getDocs(collection(db, "matches", match.id, "rounds"));
      const rDocs = rSnap.docs.map((r) => ({ id: r.id, ...r.data() }));
      rDocs.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0));
      roundsData[match.id] = rDocs;
    }
    setRounds(roundsData);
  }

  /** ---------------- Criteria ---------------- **/
  function getCriteriaForRoundNumber(rn) {
    if (rn === 1) return Object.keys(ROUND_CRITERIA_MAX["round 1"]);
    if (rn === 2) return Object.keys(ROUND_CRITERIA_MAX["round 2"]);
    return Object.keys(ROUND_CRITERIA_MAX["round 3"]);
  }

  /** ---------------- Score Handling ---------------- **/
  function handleScoreChange(matchId, roundId, teamKey, crit, val, rtype, pid = null) {
    const roundKey = `round ${rtype.toString().split(" ")[1] || rtype}`;
    const maxVal = ROUND_CRITERIA_MAX[roundKey]?.[crit.toLowerCase()] || 9999;
    let num = Number(val);
    if (isNaN(num)) num = 0;
    num = Math.min(Math.max(num, 0), maxVal);

    setRounds((prev) => {
      const rList = prev[matchId] || [];
      const newRList = rList.map((r) => {
        if (r.id !== roundId) return r;
        const newScores = JSON.parse(JSON.stringify(r.scores || {}));
        if (r.roundNumber === 3) {
          if (!newScores[teamKey]) newScores[teamKey] = {};
          newScores[teamKey][crit] = num;
        } else {
          if (!pid) return r;
          if (!newScores[teamKey]) newScores[teamKey] = {};
          if (!newScores[teamKey][pid]) newScores[teamKey][pid] = {};
          newScores[teamKey][pid][crit] = num;
        }
        return { ...r, scores: newScores };
      });
      return { ...prev, [matchId]: newRList };
    });
  }

  async function handleSaveScores(matchId, roundId) {
    const round = (rounds[matchId] || []).find((r) => r.id === roundId);
    if (!round) return;
    try {
      await updateDoc(doc(db, "matches", matchId, "rounds", roundId), { scores: round.scores });
      setSavedRounds((prev) => ({ ...prev, [roundId]: true }));
      setTimeout(() => setSavedRounds((prev) => ({ ...prev, [roundId]: false })), 2000);
    } catch (err) {
      console.error("Failed to save scores", err);
      setMessage("❌ Error saving scores");
    }
  }

  /** ---------------- Clear Match 1 ---------------- **/
  // async function handleClearMatch() {
  //   if (!confirm("Clear Match 1 and rematchmake?")) return;
  //   setLoading(true);
  //   try {
  //     for (const match of matches) {
  //       const rSnap = await getDocs(collection(db, "matches", match.id, "rounds"));
  //       for (const r of rSnap.docs) await deleteDoc(doc(db, "matches", match.id, "rounds", r.id));
  //       await deleteDoc(doc(db, "matches", match.id));
  //     }
  //     setMatches([]);
  //     setRounds({});
  //     setMessage("✅ Match 1 cleared");
  //   } catch (err) {
  //     console.error(err);
  //     setMessage("❌ Error clearing match");
  //   } finally {
  //     setLoading(false);
  //   }
  // }


  /**
   * End a single match (saves rounds -> saves totals -> updates match doc -> increments root team stats)
   * matchId: string
   */
  // match 1 end match

async function handleEndMatch(matchId, teamAId, teamBId, totalA, totalB, rounds) {
  try {
    let winnerId = null;
    if (totalA > totalB) winnerId = teamAId;
    else if (totalB > totalA) winnerId = teamBId;

    // ✅ 1. Update all round docs in parallel
    if (rounds[matchId]) {
      await Promise.all(
        rounds[matchId].map((r) =>
          updateDoc(doc(db, "matches", matchId, "rounds", r.id), {
            scores: r.scores || {},
          })
        )
      );
    }

    // ✅ 2. Update the match doc with totals, winner, and status
    await updateDoc(doc(db, "matches", matchId), {
      "teamA.totalScore": totalA,
      "teamB.totalScore": totalB,
      winner: winnerId,
      status: "completed",
    });

    // ✅ 3. Update Team A stats
    await updateDoc(doc(db, "teams", teamAId), {
      totalScore: increment(totalA),
      wins: increment(winnerId === teamAId ? 1 : 0),
      losses: increment(winnerId === teamBId ? 1 : 0),
      matchesPlayed: increment(1),
    });

    // ✅ 4. Update Team B stats
    await updateDoc(doc(db, "teams", teamBId), {
      totalScore: increment(totalB),
      wins: increment(winnerId === teamBId ? 1 : 0),
      losses: increment(winnerId === teamAId ? 1 : 0),
      matchesPlayed: increment(1),
    });
    alert("Match ended! dont click match end again!!! (for this match obv)");
    return "✅ Match ended!";

  } catch (err) {
    console.error("Error ending match:", err);
    return "❌ Error ending match";
  }
}


  /** ---------------- Generate Match 1 ---------------- **/
  async function handleGenerateMatch1() {
    if (teams.length % 2 !== 0) {
      alert("Team count must be even");
      return;
    }
    setLoading(true);
    try {
      await generateMatch1(teams);
      await fetchMatchesAndRounds();
      setMessage("✅ Match 1 generated!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error generating match");
    } finally {
      setLoading(false);
    }
  }


  /** ---------------- UI ---------------- **/
  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-gray-50 rounded-xl shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 tracking-tight">Match 1</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGenerateMatch1}
          disabled={loading || matches.length > 0}
          className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Match 1"}
        </button>
        {/* <button
          onClick={handleClearMatch}
          disabled={loading || matches.length === 0}
          className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition disabled:opacity-50"
        >
          Clear Match 1
        </button> */}
      </div>

      {message && <p className="mb-6 text-lg font-medium text-center text-blue-700 bg-blue-100 py-2 rounded">{message}</p>}

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
                {match.teamA?.name} <span className="text-gray-500">vs</span>{" "}
                {match.teamB?.name}
              </span>
              <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                {match.status}
              </span>
            </h2>

            {(rounds[match.id] || []).map((r) => {
              const criteria = getCriteriaForRoundNumber(r.roundNumber);

              if (r.roundNumber === 3) {
                return (
                  <div key={r.id} className="mb-4">
                    <p className="font-semibold text-blue-700 mb-3">
                      Round 3 — Team Evaluation
                    </p>
                    <div className="overflow-x-auto">
                      <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-2 py-1">Team Name</th>
                            {criteria.map((c) => (
                              <th key={c} className="border px-2 py-1">
                                {c}
                              </th>
                            ))}
                            <th className="border px-2 py-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["teamA", "teamB"].map((tk) => {
                            const teamScores = r.scores?.[tk] || {};
                            const total = criteria.reduce(
                              (s, c) => s + Number(teamScores[c] || 0),
                              0
                            );
                            return (
                              <tr key={tk}>
                                <td className="border px-2 py-1 font-semibold">
                                  {tk === "teamA"
                                    ? match.teamA?.name
                                    : match.teamB?.name}
                                </td>
                                {criteria.map((c) => (
                                  <td key={c} className="border px-2 py-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={
                                        ROUND_CRITERIA_MAX["round 3"][
                                          c.toLowerCase()
                                        ]
                                      }
                                      value={teamScores[c] ?? 0}
                                      onChange={(e) =>
                                        handleScoreChange(
                                          match.id,
                                          r.id,
                                          tk,
                                          c,
                                          e.target.value,
                                          r.roundNumber
                                        )
                                      }
                                      className="w-20 border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-blue-400"
                                    />
                                  </td>
                                ))}
                                <td className="border px-2 py-1 font-semibold">
                                  {total}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => handleSaveScores(match.id, r.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                      >
                        {savedRounds[r.id] ? "Saved!" : "Save Scores"}
                      </button>
                    </div>
                  </div>
                );
              }

              // rounds 1 & 2 (participant-level)
              return (
                <div key={r.id} className="mb-4">
                  <p className="font-semibold text-blue-700 mb-3">
                    Round {r.roundNumber}
                  </p>

                  {["teamA", "teamB"].map((tk) => {
                    const teamScores = r.scores?.[tk] || {};
                    if (!teamScores || Object.keys(teamScores).length === 0)
                      return null;
                    const firstParticipant = Object.values(teamScores)[0] || {};
                    const partCriteria = Object.keys(firstParticipant).filter(
                      (k) =>
                        ![
                          "id",
                          "name",
                          "role",
                          "teamId",
                          "rootId",
                          "totalScore",
                        ].includes(k)
                    );

                    return (
                      <div key={tk} className="mb-4">
                        <p className="font-semibold text-gray-700 mb-2">
                          {tk === "teamA"
                            ? match.teamA?.name
                            : match.teamB?.name}
                        </p>
                        <div className="overflow-x-auto">
                          <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-2 py-1">
                                  Participant
                                </th>
                                {partCriteria.map((c) => (
                                  <th key={c} className="border px-2 py-1">
                                    {c}
                                  </th>
                                ))}
                                <th className="border px-2 py-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.values(teamScores).map((p) => {
                                const total = partCriteria.reduce(
                                  (s, c) => s + Number(p[c] || 0),
                                  0
                                );
                                return (
                                  <tr key={p.id}>
                                    <td className="border px-2 py-1">
                                      {p.name}
                                    </td>
                                    {partCriteria.map((c) => (
                                      <td key={c} className="border px-2 py-1">
                                        <input
                                          type="number"
                                          min={0}
                                          max={
                                            ROUND_CRITERIA_MAX[
                                              `round ${r.roundNumber}`
                                            ][c.toLowerCase()]
                                          }
                                          value={p[c] ?? 0}
                                          onChange={(e) =>
                                            handleScoreChange(
                                              match.id,
                                              r.id,
                                              tk,
                                              c,
                                              e.target.value,
                                              r.roundNumber,
                                              p.id
                                            )
                                          }
                                          className="w-20 border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-blue-400"
                                        />
                                      </td>
                                    ))}
                                    <td className="border px-2 py-1 font-semibold">
                                      {total}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-3">
                    <button
                      onClick={() => handleSaveScores(match.id, r.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
                    >
                      {savedRounds[r.id] ? "Saved!" : "Save Scores"}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="mt-6 border-t pt-4">
              <p className="font-semibold text-lg text-purple-700 mb-2">
                Total Scores
              </p>
              <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Team</th>
                    <th className="border px-2 py-1">Cumulative Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 font-semibold">
                      {match.teamA?.name}
                    </td>
                    <td className="border px-2 py-1">{totalA}</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1 font-semibold">
                      {match.teamB?.name}
                    </td>
                    <td className="border px-2 py-1">{totalB}</td>
                  </tr>
                </tbody>
              </table>

              {/* ✅ Per-match End button */}
              <button
  onClick={() =>
    handleEndMatch(
      match.id,
      match.teamA.id,
      match.teamB.id,
      computeTeamTotal(match.id, "teamA"),
      computeTeamTotal(match.id, "teamB"), rounds
    )
  }
                disabled={loading || match.status === "completed"}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
              >
                {match.status === "completed"
                  ? "Match Ended"
                  : "End This Match"}
              </button>
            </div>
          </div>
        );
      })}    </div>
  );
}

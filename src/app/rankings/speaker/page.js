"use client";

import { useEffect, useState } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function SpeakerRanking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const fetchRanking = async () => {
      let speakerScores = {}; // { participantId: { name, teamId, totalScore } }

      // Step 0: fetch all teams to get team names
      const teamsSnap = await getDocs(collection(db, "teams"));
      const teamsMap = {}; // teamId -> name
      teamsSnap.docs.forEach((t) => {
        teamsMap[t.id] = t.data().name;
      });

      // Step 1: fetch matches (day 1–3)
      const matchesSnap = await getDocs(
        query(collection(db, "matches"), where("day", "<=", 3))
      );

      for (const m of matchesSnap.docs) {
        const matchId = m.id;
        const matchData = m.data();

        // Step 2: fetch rounds
        const roundsSnap = await getDocs(collection(db, "matches", matchId, "rounds"));
        const round1 = roundsSnap.docs.find((r) => r.data().roundNumber === 1);

        if (!round1) continue;

        const scores = round1.data().scores || {};

        // Step 3: accumulate each participant's total
        ["teamA", "teamB"].forEach((tk) => {
          const teamScoresObj = scores[tk] || {};
          Object.entries(teamScoresObj).forEach(([pid, pScores]) => {
            const total = Object.values(pScores)
              .filter((v) => typeof v === "number")
              .reduce((s, v) => s + v, 0);

            if (!speakerScores[pid]) {
              speakerScores[pid] = {
                name: pScores.name || "Unknown",
                teamId: pScores.teamId || matchData[tk]?.id,
                teamName: teamsMap[pScores.teamId || matchData[tk]?.id] || "Unknown",
                totalScore: 0,
              };
            }

            speakerScores[pid].totalScore += total;
          });
        });
      }

      // Step 4: convert to array & sort
      const rankingArr = Object.values(speakerScores).sort(
        (a, b) => b.totalScore - a.totalScore
      );

      setRanking(rankingArr);
    };

    fetchRanking();
  }, []);

  return (
    <div>
      <h1>Speaker Rankings (Round 1)</h1>
      <ul>
        {ranking.map((s, i) => (
          <li key={`${s.teamId}-${i}`}>
            #{i + 1} {s.name} (Team: {s.teamName}) — Total Score: {s.totalScore}
          </li>
        ))}
      </ul>
    </div>
  );
}

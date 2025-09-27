"use client";

import { useEffect, useState } from "react";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function PolicySpeakerRanking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const fetchRanking = async () => {
      let teamScores = {};

      // Step 1: fetch matches (Day 1–3)
      const matchesSnap = await getDocs(
        query(collection(db, "matches"), where("day", "<=", 3))
      );

      for (const m of matchesSnap.docs) {
        const matchId = m.id;
        const matchData = m.data();

        // Step 2: fetch rounds for this match
        const roundsSnap = await getDocs(collection(db, "matches", matchId, "rounds"));
        const round2 = roundsSnap.docs.find((r) => r.data().roundNumber === 2);

        if (!round2) continue;

        const scores = round2.data().scores || {};

        ["teamA", "teamB"].forEach((tk) => {
          const teamInfo = matchData[tk];
          if (!teamInfo?.id) return;

          // total score for this team in round 2 (sum of participant scores)
          let total = 0;
          const teamScoresObj = scores[tk] || {};
          Object.values(teamScoresObj).forEach((p) => {
            total += Object.values(p)
              .filter((v) => typeof v === "number")
              .reduce((s, v) => s + v, 0);
          });

          if (!teamScores[teamInfo.id]) teamScores[teamInfo.id] = 0;
          teamScores[teamInfo.id] += total;
        });
      }

      // Step 3: fetch team names and policy speakers
      let speakerScores = [];
      const teamsSnap = await getDocs(collection(db, "teams"));
      const teamsMap = {};
      teamsSnap.docs.forEach((t) => {
        teamsMap[t.id] = t.data().name;
      });

      for (const [teamId, totalScore] of Object.entries(teamScores)) {
        const participantsSnap = await getDocs(collection(db, "teams", teamId, "participants"));
        participantsSnap.forEach((p) => {
          const part = p.data();
          if (part.role.toLowerCase() === "policy") {
            speakerScores.push({
              speakerId: p.id,
              name: part.name,
              teamId,
              teamName: teamsMap[teamId] || "Unknown",
              teamScore: totalScore,
            });
          }
        });
      }

      // Step 4: sort by score descending
      speakerScores.sort((a, b) => b.teamScore - a.teamScore);

      setRanking(speakerScores);
    };

    fetchRanking();
  }, []);

  return (
    <div>
      <h1>Policy Speaker Rankings</h1>
      <ul>
        {ranking.map((s, i) => (
          <li key={s.speakerId}>
            #{i + 1} {s.name} (Team: {s.teamName}) — Round 2 Total: {s.teamScore}
          </li>
        ))}
      </ul>
    </div>
  );
}

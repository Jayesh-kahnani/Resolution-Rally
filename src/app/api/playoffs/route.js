

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

import { createRound, fetchTeamMembers } from "../matches/route";



export async function generateQuarterfinals() {
  const teamsSnap = await getDocs(collection(db, "teams"));
  const teams = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const sorted = teams.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return b.wins - a.wins;
  });

  const top8 = sorted.slice(0, 8);
  if (top8.length < 8) throw new Error("Need 8 teams for QFs");

  const pairings = [
    [top8[0], top8[7]],
    [top8[1], top8[6]],
    [top8[2], top8[5]],
    [top8[3], top8[4]],
  ];

  const createdMatchIds = [];

  for (let i = 0; i < pairings.length; i++) {
    const [teamA, teamB] = pairings[i];
    const matchId = `match-4-${i + 1}`;
    const matchRef = doc(db, "matches", matchId);

await setDoc(matchRef, {
  stage: "QF",
  day: 4, // <-- crucial
  status: "scheduled",
  teamA: { id: teamA.id, name: teamA.name, totalScore: 0 },
  teamB: { id: teamB.id, name: teamB.name, totalScore: 0 },
  winner: null,
  loser: null,
  createdAt: new Date(),
});


    // fetch team members
    const teamAMembers = await fetchTeamMembers(teamA.id);
    const teamBMembers = await fetchTeamMembers(teamB.id);

    // Round 1: speaker1 + speaker2
    await createRound(
      matchId,
      1,
      "round 1",
      teamAMembers.filter(m => m.role === "speaker1" || m.role === "speaker2"),
      teamBMembers.filter(m => m.role === "speaker1" || m.role === "speaker2")
    );

    // Round 2: policy
    await createRound(
      matchId,
      2,
      "round 2",
      teamAMembers.filter(m => m.role === "policy"),
      teamBMembers.filter(m => m.role === "policy")
    );

    // Round 3: all members (team-level)
    await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

    createdMatchIds.push(matchId);
  }

  return createdMatchIds;
}



export async function generateSemifinals() {
  // ✅ 1. Explicit query for completed QFs
const matchesRef = collection(db, "matches");
const qfQuery = query(
  matchesRef,
  where("stage", "==", "QF"),
  where("status", "==", "completed")
);
const qfMatchesSnap = await getDocs(qfQuery);

  if (qfMatchesSnap.empty) {
    throw new Error("❌ No completed Quarter Finals found.");
  }

  // ✅ 2. Collect winners
  const winners = [];
  for (const qfDoc of qfMatchesSnap.docs) {
    const data = qfDoc.data();
    if (data.winner) {
const winnerRef = doc(db, "teams", data.winner);
const winnerSnap = await getDoc(winnerRef);
      if (winnerSnap.exists()) {
        winners.push({ id: winnerSnap.id, ...winnerSnap.data() });
      }
    }
  }

  if (winners.length < 4) {
    throw new Error("❌ Need 4 QF winners to generate Semifinals.");
  }

  // ✅ 3. Pairing
  const pairings = [
    [winners[0], winners[3]],
    [winners[1], winners[2]],
  ];

  const createdMatchIds = [];

  // ✅ 4. Create SF matches
  for (let i = 0; i < pairings.length; i++) {
    const [teamA, teamB] = pairings[i];
    const matchId = `match-5-${i + 1}`;
    const matchRef = doc(db, "matches", matchId);

    await setDoc(matchRef, {
      stage: "SF",
      day: 5,
      status: "scheduled",
      teamA: { id: teamA.id, name: teamA.name || "TBD", totalScore: 0 },
      teamB: { id: teamB.id, name: teamB.name || "TBD", totalScore: 0 },
      winner: null,
      loser: null,
      createdAt: new Date(),
    });

    // team members
    const teamAMembers = await fetchTeamMembers(teamA.id);
    const teamBMembers = await fetchTeamMembers(teamB.id);

    // Round 1: speaker1 + speaker2
    await createRound(
      matchId,
      1,
      "round 1",
      teamAMembers.filter(m => m.role === "speaker1" || m.role === "speaker2"),
      teamBMembers.filter(m => m.role === "speaker1" || m.role === "speaker2")
    );

    // Round 2: policy
    await createRound(
      matchId,
      2,
      "round 2",
      teamAMembers.filter(m => m.role === "policy"),
      teamBMembers.filter(m => m.role === "policy")
    );

    // Round 3: all members (team-level)
    await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

    createdMatchIds.push(matchId);
  }

  return createdMatchIds;
}



export async function generateFinals() {
  // ✅ 1. Get completed Semifinals
  const matchesRef = collection(db, "matches");
  const sfQuery = query(
    matchesRef,
    where("stage", "==", "SF"),
    where("status", "==", "completed")
  );
  const sfMatchesSnap = await getDocs(sfQuery);

  if (sfMatchesSnap.empty) {
    throw new Error("❌ No completed Semifinals found.");
  }

  // ✅ 2. Collect winners
  const winners = [];
  for (const sfDoc of sfMatchesSnap.docs) {
    const data = sfDoc.data();
    if (data.winner) {
      const winnerRef = doc(db, "teams", data.winner);
      const winnerSnap = await getDoc(winnerRef);
      if (winnerSnap.exists()) {
        winners.push({
          id: winnerSnap.id,
          name:
            winnerSnap.data().name ||
            data.teamA?.name ||
            data.teamB?.name ||
            "TBD",
          ...winnerSnap.data(),
        });
      }
    }
  }

  if (winners.length < 2) {
    throw new Error("❌ Need 2 SF winners to generate Final.");
  }

  const createdMatchIds = [];

  // ✅ 3. Only one pairing
  const [teamA, teamB] = winners;
  const matchId = `match-6-1`;
  const matchRef = doc(db, "matches", matchId);

  await setDoc(matchRef, {
    stage: "F",
    day: 6,
    status: "scheduled",
    teamA: { id: teamA.id, name: teamA.name || "TBD", totalScore: 0 },
    teamB: { id: teamB.id, name: teamB.name || "TBD", totalScore: 0 },
    winner: null,
    loser: null,
    createdAt: new Date(),
  });

  // ✅ 4. Team members + rounds
  const teamAMembers = await fetchTeamMembers(teamA.id);
  const teamBMembers = await fetchTeamMembers(teamB.id);
  // Round 1: speaker1 + speaker2
  await createRound(
    matchId,
    1,
    "round 1",
    teamAMembers.filter(m => m.role === "speaker1" || m.role === "speaker2"),
    teamBMembers.filter(m => m.role === "speaker1" || m.role === "speaker2")
  );

  // Round 2: policy
  await createRound(
    matchId,
    2,
    "round 2",
    teamAMembers.filter(m => m.role === "policy"),
    teamBMembers.filter(m => m.role === "policy")
  );

  // Round 3: team-level
  await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

  createdMatchIds.push(matchId);

  return createdMatchIds;

}

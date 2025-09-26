import { collection, doc, setDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

/** Shuffle helper */
export function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

/** Fetch participants for a team */
export async function fetchTeamMembers(teamId) {
  const membersSnap = await getDocs(collection(db, "teams", teamId, "participants"));
  return membersSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

export const ROUND_CRITERIA = {
  "round 1": ["matter", "manner", "method"],
  "round 2": ["matter", "manner", "feasibilitycreativity"],
  "round 3": ["questions", "answers", "answertoadjudicator"],
};

export const ROUND_CRITERIA_MAX = {
  "round 1": { matter: 8, manner: 6, method: 6 },
  "round 2": { matter: 15, manner: 10, feasibilitycreativity: 10 },
  "round 3": { questions: 10, answers: 10, answertoadjudicator: 5 },
};

/** Create round doc */
export async function createRound(matchId, roundNumber, roundName, teamAMembers = [], teamBMembers = []) {
  const rawCriteria = ROUND_CRITERIA[roundName] || [];
  const criteria = rawCriteria.map((c) => String(c).toLowerCase());

  const buildParticipantScores = (members = []) => {
    const arr = Array.isArray(members) ? members.filter(Boolean) : [];
    return arr.reduce((acc, p) => {
      const pid = p.id || p.rootId || `${Math.random().toString(36).slice(2, 9)}`;
      acc[pid] = {
        id: pid,
        name: p.name || "",
        role: p.role || "",
        teamId: p.teamId || null,
        rootId: p.rootId || null,
      };
      criteria.forEach((c) => {
        acc[pid][c] = 0;
      });
      return acc;
    }, {});
  };

  const teamZeroScores = () => {
    const obj = {};
    criteria.forEach((c) => (obj[c] = 0));
    return obj;
  };

  let scores;
  if (roundNumber === 3) {
    scores = { teamA: teamZeroScores(), teamB: teamZeroScores() };
  } else {
    scores = {
      teamA: buildParticipantScores(teamAMembers),
      teamB: buildParticipantScores(teamBMembers),
    };
  }

  const roundRef = await addDoc(collection(db, "matches", matchId, "rounds"), {
    roundNumber,
    type: roundName,
    scores,
    createdAt: new Date(),
  });

  return roundRef.id;
}

/** Generate Match 1 randomly */
export async function generateMatch1(teams = []) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error("generateMatch1 requires an array of teams (>=2).");
  }
  if (teams.length % 2 !== 0) {
    throw new Error("Team count must be even for Match 1 generation.");
  }

  const shuffled = shuffle([...teams]);
  const createdMatchIds = [];

  for (let i = 0, idx = 1; i < shuffled.length; i += 2, idx++) {
    const teamA = shuffled[i];
    const teamB = shuffled[i + 1];
    const matchId = `match-1-${idx}`;

    const teamAMembers = await fetchTeamMembers(teamA.id).catch(() => []);
    const teamBMembers = await fetchTeamMembers(teamB.id).catch(() => []);

    await setDoc(doc(db, "matches", matchId), {
      day: 1,
      round: "Match 1",
      status: "scheduled",
      teamA: { id: teamA.id, name: teamA.name },
      teamB: { id: teamB.id, name: teamB.name },
      winner: null,
      loser: null,
      createdAt: new Date(),
    });

    await createRound(matchId, 1, "round 1", teamAMembers, teamBMembers);
    await createRound(matchId, 2, "round 2", teamAMembers, teamBMembers);
    await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

    createdMatchIds.push(matchId);
  }
  return createdMatchIds;
}

/** Manual Pairing (specific 2 teams) */
export async function manualPairing(teamAId, teamBId) {
  if (!teamAId || !teamBId) throw new Error("Both team IDs are required for manual pairing.");

  const teamARef = doc(db, "teams", teamAId);
  const teamBRef = doc(db, "teams", teamBId);
  const teamAMembers = await fetchTeamMembers(teamAId).catch(() => []);
  const teamBMembers = await fetchTeamMembers(teamBId).catch(() => []);

  const teamAData = { id: teamAId, name: teamAId };
  const teamBData = { id: teamBId, name: teamBId };

  const matchId = `match-1-manual-${Date.now()}`;

  await setDoc(doc(db, "matches", matchId), {
    day: 1,
    round: "Match 1 (Manual)",
    status: "scheduled",
    teamA: { id: teamAData.id, name: teamAData.name },
    teamB: { id: teamBData.id, name: teamBData.name },
    winner: null,
    loser: null,
    createdAt: new Date(),
  });

  await createRound(matchId, 1, "round 1", teamAMembers, teamBMembers);
  await createRound(matchId, 2, "round 2", teamAMembers, teamBMembers);
  await createRound(matchId, 3, "round 3", teamAMembers, teamBMembers);

  return matchId;
}

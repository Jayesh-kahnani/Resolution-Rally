// src/app/api/matches/route.js
import { collection, doc, setDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

/** Shuffle helper */
export function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

/** Fetch participants for a team */
export async function fetchTeamMembers(teamId) {
  const membersSnap = await getDocs(
    collection(db, "teams", teamId, "participants")
  );
  // always return an array
  return membersSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/** Criteria per round (kept readable here, but we'll normalize to lowercase in code) */
export const ROUND_CRITERIA = {
  "round 1": ["matter", "manner", "method"],
  "round 2": ["matter", "manner", "feasibilitycreativity"],
  // keep human readable but we'll lowercase keys internally
  "round 3": ["questions", "answers", "answerToAdjudicator"],
};

/** Max scores per criteria (use lowercase keys to match normalized criteria) */
export const ROUND_CRITERIA_MAX = {
  "round 1": { matter: 8, manner: 6, method: 6 },
  "round 2": { matter: 15, manner: 10, feasibilitycreativity: 10 },
  "round 3": { questions: 10, answers: 10, answertoadjudicator: 5 },
};

/**
 * Create a round inside matches/{matchId}/rounds
 * - roundNumber: number (1|2|3)
 * - roundName: "round 1" etc.
 * - teamAmeta/teamBmeta: { id, name } (meta from match doc) - optional here but passed by callers
 * - teamAMembers/teamBMembers: arrays of participant objects (each should have id, name, role, teamId, rootId etc)
 *
 * Writes a document shape compatible with the UI page:
 *   { roundNumber, type, scores: { teamA: {...}, teamB: {...} } }
 *
 * Participant-level rounds: scores.teamA is an object keyed by participant id:
 *   scores.teamA[participantId] = { id, name, role, ..., <criteria keys with 0> }
 *
 * Team-level round (roundNumber===3): scores.teamA is { <criteria>: 0, ... }
 */
export async function createRound(
  matchId,
  roundNumber,
  roundName,
  teamAMembers = [],
  teamBMembers = []
) {
  // normalize criteria keys to lowercase strings
  const rawCriteria = ROUND_CRITERIA[roundName] || [];
  const criteria = rawCriteria.map((c) => String(c).toLowerCase());

  // helper to build participant-level structure (safe)
  const buildParticipantScores = (members = []) => {
    const arr = Array.isArray(members) ? members.filter(Boolean) : [];
    return arr.reduce((acc, p) => {
      const pid = p.id || p.rootId || `${Math.random().toString(36).slice(2, 9)}`;
      // keep original participant metadata but avoid circular issues
      acc[pid] = { id: pid, name: p.name || "", role: p.role || "", teamId: p.teamId || null, rootId: p.rootId || null };
      // initialize criteria to 0 (lowercased)
      criteria.forEach((c) => {
        acc[pid][c] = 0;
      });
      return acc;
    }, {});
  };

  // team-level zeroed criteria
  const teamZeroScores = () => {
    const obj = {};
    criteria.forEach((c) => (obj[c] = 0));
    return obj;
  };

  // Build the scores object expected by the UI
  let scores;
  if (roundNumber === 3) {
    // team-level round
    scores = { teamA: teamZeroScores(), teamB: teamZeroScores() };
  } else {
    scores = {
      teamA: buildParticipantScores(teamAMembers),
      teamB: buildParticipantScores(teamBMembers),
    };
  }

  // add the round doc
  const roundRef = await addDoc(collection(db, "matches", matchId, "rounds"), {
    roundNumber,
    type: roundName,
    scores,
    createdAt: new Date(),
  });

  return roundRef.id;
}

/**
 * Generate Match 1 (random pairings)
 * - teams: array of team objects from the UI (each must include { id, name })
 * Returns: array of created match ids like ["match-1-1", "match-1-2", ...]
 *
 * NOTE: This signature matches what your page expects (generateMatch1(teams))
 */
export async function generateMatch1(teams = []) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error("generateMatch1 requires an array of teams (>=2).");
  }
  // ensure even number assumed by UI / you said always even
  if (teams.length % 2 !== 0) {
    throw new Error("Team count must be even for Match 1 generation.");
  }

  const shuffled = shuffle([...teams]);
  const createdMatchIds = [];

  for (let i = 0, idx = 1; i < shuffled.length; i += 2, idx++) {
    const teamA = shuffled[i];
    const teamB = shuffled[i + 1];
    const matchIndex = idx;
    const matchId = `match-1-${matchIndex}`;

    // fetch members for both teams (always return arrays)
    const teamAMembers = await fetchTeamMembers(teamA.id).catch(() => []);
    const teamBMembers = await fetchTeamMembers(teamB.id).catch(() => []);

    // create match doc (fields the page expects)
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

    // Create rounds using the same structure the page reads:
    // Round 1: first two participants each (if any)
    await createRound(
      matchId,
      1,
      "round 1",
      (teamAMembers || []).slice(0, 2),
      (teamBMembers || []).slice(0, 2)
    );

    // Round 2: third participant only (if exists), safe fallback to empty arrays
    await createRound(
      matchId,
      2,
      "round 2",
      (teamAMembers && teamAMembers.length > 2) ? [teamAMembers[2]] : [],
      (teamBMembers && teamBMembers.length > 2) ? [teamBMembers[2]] : []
    );

    // Round 3: team-level (all participants influence team-level score later)
    await createRound(matchId, 3, "round 3", teamAMembers || [], teamBMembers || []);

    createdMatchIds.push(matchId);
  }

  return createdMatchIds;
}

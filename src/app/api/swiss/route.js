// src/app/api/swiss/route.js
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { createRound, fetchTeamMembers } from "../matches/route";

/** Helper to sort by total descending */
function byTotalDesc(a, b) {
  return (b.totalFromPrev || 0) - (a.totalFromPrev || 0);
}

/** Pair a list avoiding rematches when possible */
function pairAvoidRematch(list) {
  const used = new Set();
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a || used.has(a.id)) continue;

    // find partner not used and not a previous opponent
    let partnerIndex = -1;
    for (let j = i + 1; j < list.length; j++) {
      if (used.has(list[j].id)) continue;
      if (!Array.isArray(a.opponents) || !a.opponents.includes(list[j].id)) {
        partnerIndex = j;
        break;
      }
    }
    // fallback: any unused
    if (partnerIndex === -1) {
      for (let j = i + 1; j < list.length; j++) {
        if (!used.has(list[j].id)) {
          partnerIndex = j;
          break;
        }
      }
    }

    if (partnerIndex !== -1) {
      pairs.push([a, list[partnerIndex]]);
      used.add(a.id);
      used.add(list[partnerIndex].id);
    }
  }
  return pairs;
}

/**
 * generateSwissMatch(prevMatchIds = [], roundNumber = 2)
 *
 * - prevMatchIds: array of doc ids (strings) corresponding to previous matches (eg. all match-1-* ids)
 * - roundNumber: numeric (2 or 3) used for produced match id prefix
 *
 * Returns: array of created match ids (strings).
 */
export async function generateSwissMatch(prevMatchIds = [], roundNumber = 2) {
  // defensive: ensure array
  if (!Array.isArray(prevMatchIds)) prevMatchIds = [];

  // 1) Try to load provided prevMatchIds (if any)
  const prevMatches = [];
  if (prevMatchIds.length > 0) {
    for (const mid of prevMatchIds) {
      try {
        const snap = await getDoc(doc(db, "matches", mid));
        if (snap.exists()) prevMatches.push({ id: snap.id, ...(snap.data() || {}) });
      } catch (err) {
        console.warn("Error reading prev match", mid, err);
      }
    }
  }

  // 2) Fallback: if none found, query for matches where day == 1
  if (prevMatches.length === 0) {
    try {
      const q = query(collection(db, "matches"), where("day", "==", 1));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      if (docs.length > 0) {
        prevMatches.push(...docs);
      }
    } catch (err) {
      console.warn("Fallback query for day==1 failed:", err);
    }
  }

  // If still none found, return empty result instead of throwing
  if (prevMatches.length === 0) {
    console.warn(
      "generateSwissMatch: no previous-match documents found (prevMatchIds length:",
      prevMatchIds.length,
      "). No matches created."
    );
    return [];
  }

  // 3) Build team map with totals, opponents and wins
  const teamMap = {};
  for (const m of prevMatches) {
    const a = m.teamA || {};
    const b = m.teamB || {};
    const aId = a.id;
    const bId = b.id;

    // read totalScore from team-level stored fields if present; otherwise fallback to 0
    const aTotal = (a && typeof a.totalScore === "number") ? a.totalScore : (m.teamA?.totalScore ?? 0);
    const bTotal = (b && typeof b.totalScore === "number") ? b.totalScore : (m.teamB?.totalScore ?? 0);

    if (aId) {
      if (!teamMap[aId]) {
        teamMap[aId] = { id: aId, name: a.name || "", totalFromPrev: 0, opponents: [], wins: 0 };
      }
      teamMap[aId].totalFromPrev += Number(aTotal || 0);
      if (bId) teamMap[aId].opponents.push(bId);
    }

    if (bId) {
      if (!teamMap[bId]) {
        teamMap[bId] = { id: bId, name: b.name || "", totalFromPrev: 0, opponents: [], wins: 0 };
      }
      teamMap[bId].totalFromPrev += Number(bTotal || 0);
      if (aId) teamMap[bId].opponents.push(aId);
    }

    // assign wins (no ties per your guarantee)
    if (aTotal > bTotal) {
      if (aId) teamMap[aId].wins = (teamMap[aId].wins || 0) + 1;
    } else if (bTotal > aTotal) {
      if (bId) teamMap[bId].wins = (teamMap[bId].wins || 0) + 1;
    }
  }

  // 4) Convert into arrays and classify
  const allTeams = Object.values(teamMap);
  if (allTeams.length === 0) {
    console.warn("No teams derived from previous matches; aborting.");
    return [];
  }

  const winners = [];
  const losers = [];
  for (const t of allTeams) {
    if ((t.wins || 0) > 0) winners.push(t);
    else losers.push(t);
  }

  // sort winners descending by totalFromPrev (best first), losers descending (best first)
  winners.sort(byTotalDesc);
  losers.sort(byTotalDesc);

  const pairings = [];

  // 5) If winners are odd, pair worst winner (lowest total) with best loser (highest total)
  if (winners.length % 2 !== 0) {
    const worstWinner = winners.pop(); // last (worst) since sorted desc
    const bestLoser = losers.shift(); // first (best) since sorted desc
    if (worstWinner && bestLoser) {
      pairings.push([worstWinner, bestLoser]);
    } else {
      // safety: put back if something went wrong
      if (worstWinner) winners.push(worstWinner);
      if (bestLoser) losers.unshift(bestLoser);
    }
  }

  // 6) Pair winners among themselves avoiding rematches when possible
  if (winners.length > 0) {
    pairings.push(...pairAvoidRematch(winners));
  }

  // 7) Pair losers among themselves
  if (losers.length > 0) {
    pairings.push(...pairAvoidRematch(losers));
  }

  // 8) Create matches in Firestore with deterministic ids and create rounds
  const createdMatchIds = [];
  for (let i = 0; i < pairings.length; i++) {
    const [teamA, teamB] = pairings[i];
    if (!teamA || !teamB) continue;
    const matchId = `match-${roundNumber}-${i + 1}`;

    // Write match document
    const teamAmeta = { id: teamA.id, name: teamA.name || "", totalScore: 0 };
    const teamBmeta = { id: teamB.id, name: teamB.name || "", totalScore: 0 };

    await setDoc(doc(db, "matches", matchId), {
      day: roundNumber,
      round: `Match ${roundNumber}`,
      status: "scheduled",
      teamA: teamAmeta,
      teamB: teamBmeta,
      winner: null,
      loser: null,
      createdAt: new Date(),
    });

    // Round 1: select participants with role = "speaker1" or "speaker2"
    await createRound(
      matchId,
      1,
      "round 1",
      teamAMembers.filter(m => m.role === "Speaker1" || m.role === "Speaker2"),
      teamBMembers.filter(m => m.role === "Speaker1" || m.role === "Speaker2")
    );

    // Round 2: select participants with role = "Policy"
    await createRound(
      matchId,
      2,
      "round 2",
      teamAMembers.filter(m => m.role === "Policy"),
      teamBMembers.filter(m => m.role === "Policy")
    );

    // Round 3: team-level (all members)
    await createRound(matchId, 3, "round 3", teamAMembers || [], teamBMembers || []);

    createdMatchIds.push(matchId);
  }

  return createdMatchIds;
}

export default generateSwissMatch;

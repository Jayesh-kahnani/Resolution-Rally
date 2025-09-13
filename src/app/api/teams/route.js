// src/app/api/teams/route.js
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

export async function addTeamWithParticipants(name, institution, participants = []) {
  try {
    const teamRef = await addDoc(collection(db, "teams"), {
      name,
      institution,
      totalScore: 0,
      wins: 0,
      losses: 0
    });

    const teamId = teamRef.id;

    for (const p of participants) {
      const participantRef = await addDoc(collection(db, "participants"), {
        name: p.name,
        role: p.role,
        teamId,
        totalScore: 0
      });

      await addDoc(collection(db, "teams", teamId, "participants"), {
        name: p.name,
        role: p.role,
        totalScore: 0,
        rootId: participantRef.id
      });
    }

    return teamId;
  } catch (err) {
    console.error("Error adding team:", err);
    throw err;
  }
}

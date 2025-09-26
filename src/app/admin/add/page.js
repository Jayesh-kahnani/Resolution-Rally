// src/app/admin/add/page.js
"use client"

import { useState } from "react"
import { addTeamWithParticipants } from "@/app/api/teams/route"

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig"; // adjust path if needed


export default function AdminPage() {
  const [teamName, setTeamName] = useState("")
  const [institution, setInstitution] = useState("")
  const [participants, setParticipants] = useState([
    { name: "", role: "Speaker1" },
    { name: "", role: "Speaker2" },
    { name: "", role: "Policy" }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleParticipantChange = (index, value) => {
    const newParticipants = [...participants]
    newParticipants[index].name = value
    setParticipants(newParticipants)
  }
/**
 * Reset all team stats (totalScore, wins, losses, matchesPlayed) to 0
 */
 async function resetTeamStats() {
  try {
    const teamsRef = collection(db, "teams");
    const snap = await getDocs(teamsRef);

    const updates = snap.docs.map(async (teamDoc) => {
      const teamRef = doc(db, "teams", teamDoc.id);
      await updateDoc(teamRef, {
        totalScore: 0,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
      });
    });

    await Promise.all(updates);
    console.log("✅ All team stats reset to 0");
  } catch (err) {
    console.error("❌ Error resetting team stats", err);
  }
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      await addTeamWithParticipants(teamName, institution, participants)
      setMessage("✅ Team and participants added successfully!")
      setTeamName("")
      setInstitution("")
      setParticipants([
        { name: "", role: "Speaker1" },
        { name: "", role: "Speaker2" },
        { name: "", role: "Policy" }
      ])
    } catch (err) {
      console.error(err)
      setMessage("❌ Error adding team. Check console.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Add Debate Team</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Institution</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <h2 className="font-medium mb-2">Participants</h2>
          {participants.map((p, index) => (
            <div key={index} className="mb-2">
              <label className="block text-sm font-semibold">{p.role}</label>
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleParticipantChange(index, e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder={`Enter ${p.role} name`}
                required
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Team"}
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
      <button
  onClick={resetTeamStats}
  className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
>
  Reset All Team Stats
</button>

    </div>
  )
}


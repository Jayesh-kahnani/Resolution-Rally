"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  BookOpen,
  Users,
  ListOrdered,
  Phone,
  Mail,
} from "lucide-react";

export default function HomePage() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    async function fetchDays() {
      const matchesSnap = await getDocs(collection(db, "matches"));
      const uniqueDays = [
        ...new Set(matchesSnap.docs.map((doc) => doc.data().day)),
      ];
      setDays(uniqueDays);
    }
    fetchDays();
  }, []);

  const staticLinks = [
    {
      href: "/rankings",
      label: "Rankings",
      icon: ListOrdered,
      subtitle: "See the current standings of all teams",
    },
    {
      href: "/brackets",
      label: "Playoffs",
      icon: Users,
      subtitle: "Check out the tournament matchups",
    },
    {
      href: "/rulebook.pdf",
      label: "Rulebook",
      icon: BookOpen,
      subtitle: "Download the official tournament rules",
      download: true,
    },
    // {
    //   href: "/report",
    //   label: "Report",
    //   icon: FileText,
    //   subtitle: "Report an individual or team conflicts",
    // },
  ];

  return (
    <div className="min-h-screen bg-[#E3DFD3] flex flex-col items-center p-6">
      {/* Top Section */}
      <div className="w-full max-w-5xl flex flex-col items-center justify-center mb-10 gap-4 text-center">
        <img
          src="/logo.png"
          alt="Resolution Rally Logo"
          className="w-full max-w-3xl h-auto object-contain mb-4"
        />
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#161B3B]">
          Resolution Rally 2025
        </h1>
        <p className="text-[#444E5F] text-sm md:text-lg ">
          Azim Premji University's Policy Debate Tournament
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full max-w-5xl mb-12">
        {days
          .filter((day) => day <= 3)
          .map((day) => (
            <Link key={day} href={`/matches/match-${day}`}>
              <div className="flex items-center gap-4 p-5 rounded-xl bg-[#96A086] shadow-md hover:shadow-xl hover:scale-105 transition transform cursor-pointer">
                <Users className="w-6 h-6 text-[#161B3B]" />
                <div>
                  <h2 className="text-lg font-semibold text-[#161B3B]">
                    Match {day}
                  </h2>
                  <p className="text-[#444E5F] text-xs">
                    View all pairings for match {day}
                  </p>
                </div>
              </div>
            </Link>
          ))}

        {staticLinks.map(({ href, label, icon: Icon, subtitle }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-4 p-5 rounded-xl bg-[#96A086] shadow-md hover:shadow-xl hover:scale-105 transition transform cursor-pointer">
              <Icon className="w-6 h-6 text-[#161B3B]" />
              <div>
                <h2 className="text-lg font-semibold text-[#161B3B]">
                  {label}
                </h2>
                <p className="text-[#444E5F] text-xs">{subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Support Section */}
      <div className="w-full max-w-5xl p-6 rounded-2xl bg-[#444E5F] text-[#E3DFD3] shadow-lg mb-8">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
          <Phone className="w-5 h-5" /> Support
        </h2>
        <p className="text-[#96A086] text-sm mb-3">
          If you have any questions or need assistance, reach out to us:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> +91 9150833323
          </li>
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:debate.club@apu.edu.in"
              className="underline hover:text-[#96A086]"
            >
              debate.club@apu.edu.in
            </a>
          </li>
        </ul>
      </div>

      <p className="text-[#444E5F] text-xs mb-4 text-center">
        © 2025 Resolution Rally. All rights reserved.
      </p>
    </div>
  );
}

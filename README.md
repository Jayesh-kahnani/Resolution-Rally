<h1 align="center">Hi 👋, I'm Jayesh</h1>
<h3 align="center">I am Designer and Developer pursuing a degree in physics</h3>


# Presenting Resolution Rally 2025

**Resolution Rally** is Azim Premji University’s **Policy Debate Tournament**, held on **September 26 & 27, 2025**. This project includes both **admin tools** for managing matches and **participant-facing dashboards** for viewing fixtures, brackets, and results.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Deployment](#setup--deployment)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [Contact](#contact)

---

## Overview

Resolution Rally is designed to host a **modern, competitive debate tournament** with unique rules:

- Each team has **3 members**:
  - **Round 1**: 2 speakers (The Case / Ideology)
  - **Round 2**: 1 Policy speaker (Evidence / Proposal)
  - **Round 3**: Cross-examination ("The Gavel")
- Teams compete through **Quarterfinals, Semifinals, and Finals**.
- The platform provides:
  - **Admin dashboard** to generate and manage matches & rounds.
  - **Participant/public dashboard** to view fixtures, brackets, and scores.

---

## Features

### Admin Features

- Create **Match 1**, **Quarterfinals**, **Semifinals**, and **Finals** automatically based on team scores.
- Fetch and manage **team members** and participants.
- Create **rounds** with scoring criteria per participant and team.
- Fully synced with **Firebase Firestore**.

### Participant Dashboard

- **Mobile-first, minimalist UI** inspired by NLS Debate websites.
- **Fixtures page** showing upcoming and completed matches.
- **Playoff brackets** with live scores.
- **Quick links** and schedule for participants.
- Real-time updates from Firebase.

---

## Tech Stack

- **Frontend**: Next.js 13 (App Router, React 18)
- **Backend / Database**: Firebase Firestore
- **Hosting / Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Optional UI Components**: Shadcn/UI (for buttons, cards, etc.)
- **Version Control**: Git & GitHub

---

## Project Structure

```text
Resolution-Rally/
│
├─ app/
│  ├─ api/                 # Firebase API routes & helper functions
│  ├─ matches/             # Match generation & round management
│  ├─ fixtures/            # Public-facing fixture pages
│  ├─ playoffs/            # Bracket visualization
│  └─ page.js              # Participant homepage / dashboard
│
├─ components/             # Reusable UI components
│  └─ ui/
│     └─ button.js
│
├─ firebaseConfig.js       # Firebase setup
├─ package.json
├─ tailwind.config.js
└─ README.md
```

<p align="left"> <img src="https://komarev.com/ghpvc/?username=jayesh-kahnani&label=Profile%20views&color=0e75b6&style=flat" alt="jayesh-kahnani" /> </p>

<h3 align="left">Connect with me:</h3>
<p align="left">
<a href="https://linkedin.com/in/jayeshkahnani" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="jayeshkahnani" height="30" width="40" /></a>
<a href="https://instagram.com/jayesh_kahnani" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg" alt="jayesh_kahnani" height="30" width="40" /></a>
<a href="https://www.behance.net/jayeshkahnani" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/behance.svg" alt="jayeshkahnani" height="30" width="40" /></a>
</p>

<h3 align="left">Languages and Tools:</h3>
<p align="left"> <a href="https://firebase.google.com/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg" alt="firebase" width="40" height="40"/> </a> <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40"/> </a> <a href="https://nodejs.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" alt="nodejs" width="40" height="40"/> </a> <a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/> </a> <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" alt="tailwind" width="40" height="40"/> </a> </p>

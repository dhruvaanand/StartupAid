# Gommies

**Gommies** is a gamified, social productivity app designed to keep students fiercely focused and deeply engaged with their studies. By blending group accountability with competitive gamification, Gommies transforms solitary studying into an interactive, team-based experience.

## 🚀 Key Features

- **Study Circles & Leaderboards**: Form "circles" with your friends or classmates. Track collective progress and compete on weekly XP leaderboards to see who is putting in the most work.
- **Deep Focus Sessions**: Start synchronized study timers. Any friends in your circle can view what topic you are tackling in real-time.
- **Focus Reinforcement (Nudging)**: Once a session is active, if a user gets distracted and leaves the app (backgrounds it), the app automatically triggers a "nudge" to the circle, keeping everyone mutually accountable.
- **Priority Maps**: View topics ordered by exam frequency and peer difficulty scores to strategically optimize study sessions.
- **Gamified Progression**: Earn XP based on the exact minutes you study (XP = minutes * 2). Maintain persistent daily streaks and hit daily goal targets.

---

## 🛠 Tech Stack

- **Frontend**: React Native with [Expo](https://expo.dev/) (TypeScript)
- **Backend**: Python 3 with [FastAPI](https://fastapi.tiangolo.com/)
- **Database / Auth**: [Supabase](https://supabase.com/)

---

## 📂 Project Structure

```
gommies/
├── backend/          # FastAPI backend services & endpoints
│   ├── main.py       # Main FastAPI application 
│   ├── pyproject.toml# Python dependencies (managed via uv/pip)
│   └── .env          # Backend environment variables
└── frontend/         # Expo React Native application
    ├── app/          # Navigation and app screens (Expo Router)
    ├── hooks/        # Custom React hooks
    └── constants/    # Theming, tokens, and icons
```

---

## 🚦 How to Run the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) 3.10+ (Ideally managed via a virtual environment or `uv`)
- A [Supabase](https://supabase.com/) project with the appropriate table schema seeded.

### 1. Backend Setup

The FastAPI backend runs on `localhost:8000` and manages all transactional database writes for focus sessions and stats.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (if not already done via `uv` or `venv`):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On macOS/Linux
   ```
3. Install the dependencies:
   *(If you use pip)*
   ```bash
   pip install fastapi "uvicorn[standard]" supabase python-dotenv pydantic
   ```
   *(If using `uv`, you can sync from `uv.lock` or `pyproject.toml`)*
   ```bash
   uv sync
   ```
4. Set up environment variables:
   Ensure you have a `.env` file in the `backend/` directory with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_or_service_key
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will now be accessible at `http://localhost:8000`.*

### 2. Frontend Setup

The frontend is an Expo app that needs to connect to the backend API.

1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm run start
   ```
4. Scan the generated QR code using the **Expo Go** app on your iOS or Android device, or press `i` in the terminal to launch the iOS Simulator.

*Note: Since the physical device runs on its own network stack, if you are testing on a real device, ensure your frontend `fetch` calls accurately point to your computer's local IP address rather than `localhost:8000`.*

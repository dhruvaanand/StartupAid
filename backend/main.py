from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv()
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def get_current_monday():
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()

# --- HOME SCREEN ---

@app.get("/user/{user_id}")
def get_user(user_id: str):
    try:
        state_resp = supabase.table("user_state").select("*").eq("user_id", user_id).execute()
        if not state_resp.data:
            return {"error": "User state not found"}
        state = state_resp.data[0]
        
        user_resp = supabase.table("users").select("name").eq("id", user_id).execute()
        name = user_resp.data[0]["name"] if user_resp.data else "Unknown"
        
        return {
            "name": name,
            "streak": state.get("streak", 0),
            "xp_total": state.get("xp_total", 0),
            "daily_goal_target": state.get("daily_goal_target", 0),
            "daily_goal_current": state.get("daily_goal_current", 0),
            "freeze_active": state.get("freeze_active", False)
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/leaderboard/{circle_id}")
def get_leaderboard(circle_id: str):
    try:
        monday = get_current_monday()
        
        circle_members_resp = supabase.table("circle_members").select("user_id").eq("circle_id", circle_id).execute()
        member_ids = [m["user_id"] for m in circle_members_resp.data]
        
        if not member_ids:
            return []
            
        xp_resp = supabase.table("weekly_xp").select("user_id, xp_week, users(name)").in_("user_id", member_ids).eq("week_start", monday).order("xp_week", desc=True).limit(3).execute()
        
        result = []
        for x in xp_resp.data:
            result.append({
                "name": x.get("users", {}).get("name", "Unknown") if x.get("users") else "Unknown",
                "xp_week": x.get("xp_week", 0)
            })
            
        return result
    except Exception as e:
        return {"error": str(e)}

@app.get("/today-topic/{course_code}")
def get_today_topic(course_code: str):
    try:
        resp = supabase.table("topics").select("name, priority_level, exam_frequency_score").eq("course_code", course_code).order("exam_frequency_score", desc=True).limit(1).execute()
        if not resp.data:
            return {"error": "No topics found"}
        return resp.data[0]
    except Exception as e:
        return {"error": str(e)}

# --- CIRCLES SCREEN ---

@app.get("/circles/{user_id}")
def get_circles(user_id: str):
    try:
        members_resp = supabase.table("circle_members").select("circle_id, circles(id, name, course_code)").eq("user_id", user_id).execute()
        
        circles = []
        for m in members_resp.data:
            circle_data = m.get("circles")
            if not circle_data: continue
                
            sessions_resp = supabase.table("study_sessions").select("id").eq("circle_id", circle_data["id"]).eq("is_active", True).execute()
            active_count = len(sessions_resp.data)
            
            circles.append({
                "id": circle_data["id"],
                "name": circle_data["name"],
                "course_code": circle_data["course_code"],
                "active_count": active_count
            })
            
        return circles
    except Exception as e:
        return {"error": str(e)}

# --- CIRCLE DETAIL SCREEN ---

@app.get("/circle/{circle_id}")
def get_circle_detail(circle_id: str):
    try:
        resp = supabase.table("circles").select("id, name, course_code").eq("id", circle_id).execute()
        if not resp.data:
            return {"error": "Circle not found"}
        return resp.data[0]
    except Exception as e:
        return {"error": str(e)}

@app.get("/circle/{circle_id}/members")
def get_circle_members(circle_id: str):
    try:
        resp = supabase.table("study_sessions").select("user_id, current_topic, is_active, started_at, users(name)").eq("circle_id", circle_id).eq("is_active", True).execute()
        
        result = []
        now = datetime.now(timezone.utc)
        for s in resp.data:
            started_at = datetime.fromisoformat(s["started_at"].replace('Z', '+00:00'))
            minutes = int((now - started_at).total_seconds() / 60)
            
            if minutes > 120:
                minutes = 0
                
            result.append({
                "user_id": s["user_id"],
                "name": s.get("users", {}).get("name", "Unknown") if s.get("users") else "Unknown",
                "current_topic": s["current_topic"],
                "is_active": s["is_active"],
                "minutes": minutes
            })
            
        return result
    except Exception as e:
        return {"error": str(e)}

# --- PRIORITY MAP SCREEN ---

@app.get("/topics/{course_code}")
def get_topics(course_code: str):
    try:
        resp = supabase.table("topics").select("id, name, exam_frequency_score, peer_difficulty_score, priority_level").eq("course_code", course_code).order("exam_frequency_score", desc=True).execute()
        return resp.data
    except Exception as e:
        return {"error": str(e)}

# --- FOCUS SESSION ---

class StartSessionRequest(BaseModel):
    user_id: str
    circle_id: str
    current_topic: str

@app.post("/session/start")
def start_session(req: StartSessionRequest):
    try:
        now = datetime.now(timezone.utc).isoformat()
        resp = supabase.table("study_sessions").insert({
            "user_id": req.user_id,
            "circle_id": req.circle_id,
            "current_topic": req.current_topic,
            "started_at": now,
            "is_active": True
        }).execute()
        
        if not resp.data:
            return {"error": "Failed to start session"}
            
        session = resp.data[0]
        return {
            "session_id": session["id"],
            "started_at": session["started_at"]
        }
    except Exception as e:
        return {"error": str(e)}

class EndSessionRequest(BaseModel):
    session_id: str
    user_id: str
    xp_earned: int
    
@app.post("/session/end")
def end_session(req: EndSessionRequest):
    try:
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()
        
        session_resp = supabase.table("study_sessions").update({
            "is_active": False,
            "ended_at": now
        }).eq("id", req.session_id).execute()
        
        if not session_resp.data:
            return {"error": "Session not found"}
            
        session = session_resp.data[0]
        started_at = datetime.fromisoformat(session["started_at"].replace('Z', '+00:00'))
        minutes_studied = int((now_dt - started_at).total_seconds() / 60)
        
        state_resp = supabase.table("user_state").select("*").eq("user_id", req.user_id).execute()
        if not state_resp.data:
            return {"error": "User state not found"}
            
        state = state_resp.data[0]
        
        new_xp_total = state.get("xp_total", 0) + req.xp_earned
        new_daily_goal = state.get("daily_goal_current", 0) + minutes_studied
        target = state.get("daily_goal_target", 0)
        streak = state.get("streak", 0)
        
        if state.get("daily_goal_current", 0) < target and new_daily_goal >= target:
            streak += 1
            
        supabase.table("user_state").update({
            "xp_total": new_xp_total,
            "daily_goal_current": new_daily_goal,
            "streak": streak
        }).eq("user_id", req.user_id).execute()
        
        monday = get_current_monday()
        weekly_resp = supabase.table("weekly_xp").select("*").eq("user_id", req.user_id).eq("week_start", monday).execute()
        
        if weekly_resp.data:
            new_week_xp = weekly_resp.data[0].get("xp_week", 0) + req.xp_earned
            supabase.table("weekly_xp").update({"xp_week": new_week_xp}).eq("user_id", req.user_id).eq("week_start", monday).execute()
        else:
            supabase.table("weekly_xp").insert({
                "user_id": req.user_id,
                "week_start": monday,
                "xp_week": req.xp_earned
            }).execute()
        
        return {
            "success": True,
            "new_xp_total": new_xp_total,
            "new_streak": streak
        }
    except Exception as e:
        return {"error": str(e)}

class NudgeRequest(BaseModel):
    circle_id: str
    distracted_user_id: str

@app.post("/session/nudge")
def nudge_session(req: NudgeRequest):
    try:
        supabase.table("study_sessions").update({
            "is_active": False
        }).eq("user_id", req.distracted_user_id).eq("circle_id", req.circle_id).eq("is_active", True).execute()
        
        return {"success": True}
    except Exception as e:
        return {"error": str(e)}
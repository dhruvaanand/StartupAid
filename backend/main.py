from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv()

app = FastAPI()
router = APIRouter(prefix="/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: {request.method} {request.url}")
    response = await call_next(request)
    print(f"DEBUG: {response.status_code}")
    return response

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Gommies Backend is live!"}

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# --- Constants ---
PRIORITY_MAP_MIN_PAPERS = 3
PREREQUISITE_CONFIDENCE_THRESHOLD = 0.3
TOPIC_LABEL_CONFIDENCE_THRESHOLD = 0.4
QUIZ_WINDOW_MINUTES = 5
QUIZ_RETAKE_HOURS = 48
XP_PER_MINUTE = 2

# --- Error helper ---
def api_error(code: str, message: str, status_code: int = 400, retry_after: Optional[str] = None):
    content: dict = {"error": {"code": code, "message": message}}
    if retry_after:
        content["error"]["retry_after"] = retry_after
    raise HTTPException(status_code=status_code, detail=content)

def get_current_monday() -> str:
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()

# ============================================================
# USER & AUTH
# ============================================================

@router.get("/user/{user_id}")
def get_user(user_id: str):
    if not user_id or user_id == "undefined":
        api_error("INVALID_USER_ID", "Invalid user_id provided")
    try:
        user_resp = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_resp.data:
            supabase.table("users").insert({
                "id": user_id,
                "name": "New Gommie",
                "email": f"user_{user_id[:8]}@example.com"
            }).execute()
            name = "New Gommie"
        else:
            name = user_resp.data[0].get("name", "Unknown")

        state_resp = supabase.table("user_state").select("*").eq("user_id", user_id).execute()
        if not state_resp.data:
            new_state = {
                "user_id": user_id,
                "streak": 0,
                "xp_total": 0,
                "daily_goal_target": 60,
                "daily_goal_current": 0,
                "freeze_active": False
            }
            supabase.table("user_state").insert(new_state).execute()
            state = new_state
        else:
            state = state_resp.data[0]

        return {
            "name": name,
            "streak": state.get("streak", 0),
            "xp_total": state.get("xp_total", 0),
            "daily_goal_target": state.get("daily_goal_target", 60),
            "daily_goal_current": state.get("daily_goal_current", 0),
            "freeze_active": state.get("freeze_active", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/stats")
def get_user_stats(user_id: str):
    try:
        user_resp = supabase.table("users").select("name").eq("id", user_id).single().execute()
        state_resp = supabase.table("user_state").select("*").eq("user_id", user_id).single().execute()
        monday = get_current_monday()
        xp_resp = supabase.table("weekly_xp").select("xp_week").eq("user_id", user_id).eq("week_start", monday).execute()
        friends_count = supabase.table("friendships").select("id", count="exact").eq("user_id", user_id).execute()
        xp_week = xp_resp.data[0]["xp_week"] if xp_resp.data else 0
        return {
            "name": user_resp.data["name"],
            "streak": state_resp.data.get("streak", 0),
            "xp_total": state_resp.data.get("xp_total", 0),
            "xp_week": xp_week,
            "daily_goal_current": state_resp.data.get("daily_goal_current", 0),
            "daily_goal_target": state_resp.data.get("daily_goal_target", 60),
            "friends_count": friends_count.count or 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# HOME SCREEN DATA
# ============================================================

@router.get("/leaderboard/{circle_id}")
def get_circle_leaderboard(circle_id: str):
    try:
        monday = get_current_monday()
        circle_members_resp = supabase.table("circle_members").select("user_id").eq("circle_id", circle_id).execute()
        member_ids = [m["user_id"] for m in circle_members_resp.data]
        if not member_ids:
            return []
        xp_resp = (
            supabase.table("weekly_xp")
            .select("user_id, xp_week, users(name)")
            .in_("user_id", member_ids)
            .eq("week_start", monday)
            .order("xp_week", desc=True)
            .limit(3)
            .execute()
        )
        return [
            {
                "name": x.get("users", {}).get("name", "Unknown") if x.get("users") else "Unknown",
                "xp_week": x.get("xp_week", 0)
            }
            for x in xp_resp.data
        ]
    except Exception as e:
        return {"error": str(e)}


@router.get("/leaderboard")
def get_leaderboard(type: str = "global", user_id: Optional[str] = None):
    try:
        monday = get_current_monday()
        query = supabase.table("weekly_xp").select("xp_week, users(id, name)").eq("week_start", monday)
        if type == "known" and user_id:
            friends_resp = supabase.table("friendships").select("friend_id").eq("user_id", user_id).execute()
            friend_ids = [f["friend_id"] for f in friends_resp.data]
            friend_ids.append(user_id)
            query = query.in_("user_id", friend_ids)
        resp = query.order("xp_week", desc=True).limit(10).execute()
        return [
            {"id": x["users"]["id"], "name": x["users"]["name"], "xp_week": x["xp_week"]}
            for x in resp.data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/today-topic/{course_code}")
def get_today_topic(course_code: str):
    try:
        resp = (
            supabase.table("topics")
            .select("name, priority_level, exam_frequency_score")
            .eq("course_code", course_code)
            .order("exam_frequency_score", desc=True)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return {"error": "No topics found"}
        return resp.data[0]
    except Exception as e:
        return {"error": str(e)}


# ============================================================
# CIRCLES
# ============================================================

@router.get("/circles/{user_id}")
def get_circles(user_id: str):
    try:
        members_resp = (
            supabase.table("circle_members")
            .select("circle_id, circles(id, name, course_code)")
            .eq("user_id", user_id)
            .execute()
        )
        circles = []
        for m in members_resp.data:
            circle_data = m.get("circles")
            if not circle_data:
                continue
            sessions_resp = (
                supabase.table("study_sessions")
                .select("id")
                .eq("circle_id", circle_data["id"])
                .eq("is_active", True)
                .execute()
            )
            circles.append({
                "id": circle_data["id"],
                "name": circle_data["name"],
                "course_code": circle_data["course_code"],
                "active_count": len(sessions_resp.data)
            })
        return circles
    except Exception as e:
        return {"error": str(e)}


@router.get("/circle/{circle_id}")
def get_circle_detail(circle_id: str):
    try:
        resp = supabase.table("circles").select("id, name, course_code").eq("id", circle_id).execute()
        if not resp.data:
            api_error("CIRCLE_NOT_FOUND", "Circle not found", 404)
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.get("/circle/{circle_id}/members")
def get_circle_members(circle_id: str):
    try:
        resp = (
            supabase.table("study_sessions")
            .select("id, user_id, current_topic, is_active, started_at, users(name)")
            .eq("circle_id", circle_id)
            .eq("is_active", True)
            .execute()
        )
        now = datetime.now(timezone.utc)
        result = []
        for s in resp.data:
            started_at = datetime.fromisoformat(s["started_at"].replace("Z", "+00:00"))
            minutes = int((now - started_at).total_seconds() / 60)
            if minutes > 120:
                minutes = 0
            result.append({
                "user_id": s["user_id"],
                "session_id": s.get("id"),
                "name": s.get("users", {}).get("name", "Unknown") if s.get("users") else "Unknown",
                "current_topic": s["current_topic"],
                "is_active": s["is_active"],
                "minutes": minutes
            })
        return result
    except Exception as e:
        return {"error": str(e)}


class CreateCircleRequest(BaseModel):
    name: str
    course_code: str
    created_by: str


@router.post("/circle")
def create_circle(req: CreateCircleRequest):
    try:
        resp = supabase.table("circles").insert({
            "name": req.name,
            "course_code": req.course_code,
            "created_by": req.created_by
        }).execute()
        if not resp.data:
            api_error("CREATE_CIRCLE_FAILED", "Failed to create circle")
        circle = resp.data[0]
        # Add creator as member
        supabase.table("circle_members").insert({
            "circle_id": circle["id"],
            "user_id": req.created_by
        }).execute()
        return circle
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class InviteRequest(BaseModel):
    user_id: str


@router.post("/circle/{circle_id}/invite")
def invite_to_circle(circle_id: str, req: InviteRequest):
    try:
        # Check circle exists
        circle_resp = supabase.table("circles").select("id").eq("id", circle_id).execute()
        if not circle_resp.data:
            api_error("CIRCLE_NOT_FOUND", "Circle not found", 404)
        # Check user exists
        user_resp = supabase.table("users").select("id").eq("id", req.user_id).execute()
        if not user_resp.data:
            api_error("USER_NOT_FOUND", "User not found", 404)
        # Check not already a member
        member_resp = (
            supabase.table("circle_members")
            .select("user_id")
            .eq("circle_id", circle_id)
            .eq("user_id", req.user_id)
            .execute()
        )
        if member_resp.data:
            api_error("ALREADY_A_MEMBER", "User is already a member of this circle")
        supabase.table("circle_members").insert({
            "circle_id": circle_id,
            "user_id": req.user_id
        }).execute()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SESSIONS
# ============================================================

class StartSessionRequest(BaseModel):
    user_id: str
    circle_id: str
    current_topic: str


@router.post("/session/start")
def start_session(req: StartSessionRequest):
    try:
        # Check for already active session
        existing = (
            supabase.table("study_sessions")
            .select("id")
            .eq("user_id", req.user_id)
            .eq("is_active", True)
            .execute()
        )
        if existing.data:
            api_error("SESSION_ALREADY_ACTIVE", "You already have an active session. End it before starting a new one.")

        now = datetime.now(timezone.utc).isoformat()
        resp = supabase.table("study_sessions").insert({
            "user_id": req.user_id,
            "circle_id": req.circle_id,
            "current_topic": req.current_topic,
            "started_at": now,
            "is_active": True
        }).execute()
        if not resp.data:
            api_error("SESSION_START_FAILED", "Failed to start session")
        session = resp.data[0]
        return {"session_id": session["id"], "started_at": session["started_at"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class EndSessionRequest(BaseModel):
    session_id: str
    user_id: str
    xp_earned: int


@router.post("/session/end")
def end_session(req: EndSessionRequest):
    try:
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()

        session_resp = supabase.table("study_sessions").update({
            "is_active": False,
            "ended_at": now
        }).eq("id", req.session_id).execute()

        if not session_resp.data:
            api_error("SESSION_NOT_FOUND", "Session not found", 404)

        session = session_resp.data[0]
        started_at = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
        minutes_studied = int((now_dt - started_at).total_seconds() / 60)

        state_resp = supabase.table("user_state").select("*").eq("user_id", req.user_id).execute()
        if not state_resp.data:
            api_error("USER_STATE_NOT_FOUND", "User state not found", 404)

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
        weekly_resp = (
            supabase.table("weekly_xp")
            .select("*")
            .eq("user_id", req.user_id)
            .eq("week_start", monday)
            .execute()
        )
        if weekly_resp.data:
            new_week_xp = weekly_resp.data[0].get("xp_week", 0) + req.xp_earned
            supabase.table("weekly_xp").update({"xp_week": new_week_xp}).eq("user_id", req.user_id).eq("week_start", monday).execute()
        else:
            supabase.table("weekly_xp").insert({
                "user_id": req.user_id,
                "week_start": monday,
                "xp_week": req.xp_earned
            }).execute()

        return {"success": True, "new_xp_total": new_xp_total, "new_streak": streak, "minutes_studied": minutes_studied}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SessionNudgeRequest(BaseModel):
    circle_id: str
    distracted_user_id: str


@router.post("/session/nudge")
def session_nudge(req: SessionNudgeRequest):
    """Broadcast a distraction nudge to all circle members for the given user."""
    try:
        # Check user is in circle
        member_check = (
            supabase.table("circle_members")
            .select("user_id")
            .eq("circle_id", req.circle_id)
            .eq("user_id", req.distracted_user_id)
            .execute()
        )
        if not member_check.data:
            api_error("NOT_A_CIRCLE_MEMBER", "User is not a member of this circle", 403)

        # Get user display name
        user_resp = supabase.table("users").select("name").eq("id", req.distracted_user_id).execute()
        display_name = user_resp.data[0]["name"] if user_resp.data else "Someone"

        # Log nudge event
        supabase.table("nudges").insert({
            "sender_id": req.distracted_user_id,
            "receiver_id": req.distracted_user_id,
            "type": "distracted",
            "circle_id": req.circle_id
        }).execute()

        return {"success": True, "display_name": display_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# PRIORITY MAP
# ============================================================

def _normalize_priority(raw: str) -> str:
    p = (raw or "MEDIUM").upper()
    if "HIGH" in p:
        return "HIGH"
    if "SKIP" in p:
        return "SKIP"
    return "MEDIUM"


@router.get("/topics/{course_code}")
def get_topics_map(course_code: str):
    """Returns PriorityMapResponse with nodes and prerequisite links."""
    try:
        topics_resp = (
            supabase.table("topics")
            .select("*")
            .eq("course_code", course_code)
            .order("exam_frequency_score", desc=True)
            .execute()
        )

        if not topics_resp.data:
            return {
                "course_code": course_code,
                "nodes": [],
                "links": [],
                "paper_count": 0
            }

        # Map DB fields → TopicNode shape (handle both old and new column names)
        nodes = []
        paper_count_max = 0
        for t in topics_resp.data:
            priority_raw = t.get("priority_label") or t.get("priority_level") or "MEDIUM"
            exam_freq = t.get("exam_frequency") or t.get("exam_frequency_score") or 0.5
            peer_diff = t.get("peer_difficulty") or t.get("peer_difficulty_score") or 0.5
            confidence = t.get("confidence", 0.8)
            paper_count = t.get("paper_count", 5)
            if paper_count > paper_count_max:
                paper_count_max = paper_count

            nodes.append({
                "id": t["id"],
                "label": t["name"],
                "priority": _normalize_priority(priority_raw),
                "exam_frequency": round(float(exam_freq), 3),
                "peer_difficulty": round(float(peer_diff), 3),
                "confidence": round(float(confidence), 3),
            })

        # Fetch prerequisite links (old table)
        links = []
        try:
            prereq_resp = (
                supabase.table("topic_prerequisites")
                .select("topic_id, prerequisite_id, confidence_score")
                .eq("course_code", course_code)
                .gte("confidence_score", PREREQUISITE_CONFIDENCE_THRESHOLD)
                .execute()
            )
            links = [
                {"source": row["topic_id"], "target": row["prerequisite_id"]}
                for row in prereq_resp.data
            ]
        except Exception:
            links = []

        # Fetch links from topic_links table (new canonical source)
        try:
            topic_links_resp = (
                supabase.table("topic_links")
                .select("source_topic_id, target_topic_id")
                .eq("course_code", course_code)
                .execute()
            )
            links += [
                {"source": row["source_topic_id"], "target": row["target_topic_id"]}
                for row in topic_links_resp.data
            ]
        except Exception:
            pass  # topic_links table may not exist yet — degrade gracefully

        # De-duplicate by (source, target) pair
        seen = set()
        deduped_links = []
        for link in links:
            key = (link["source"], link["target"])
            if key not in seen:
                seen.add(key)
                deduped_links.append(link)
        links = deduped_links

        return {
            "course_code": course_code,
            "nodes": nodes,
            "links": links,
            "paper_count": paper_count_max
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics/{course_code}/{topic_id}/prerequisites")
def get_prerequisites(course_code: str, topic_id: str):
    try:
        # Verify topic exists
        topic_resp = (
            supabase.table("topics")
            .select("id, name, paper_count")
            .eq("id", topic_id)
            .eq("course_code", course_code)
            .execute()
        )
        if not topic_resp.data:
            api_error("TOPIC_NOT_FOUND", "topic_id does not exist for course_code", 404)

        topic = topic_resp.data[0]
        paper_count = topic.get("paper_count", 5)
        if paper_count < PRIORITY_MAP_MIN_PAPERS:
            api_error(
                "INSUFFICIENT_PAST_PAPERS",
                f"Priority Map requires at least {PRIORITY_MAP_MIN_PAPERS} past papers for this course.",
                422
            )

        prereq_resp = (
            supabase.table("topic_prerequisites")
            .select("prerequisite_id, confidence_score, topics!prerequisite_id(id, name, priority_label, exam_frequency_score)")
            .eq("topic_id", topic_id)
            .eq("course_code", course_code)
            .gte("confidence_score", PREREQUISITE_CONFIDENCE_THRESHOLD)
            .execute()
        )

        prerequisites = []
        for row in prereq_resp.data:
            t = row.get("topics") or {}
            prerequisites.append({
                "id": row["prerequisite_id"],
                "name": t.get("name", "Unknown"),
                "priority": _normalize_priority(t.get("priority_label", "MEDIUM")),
                "confidence_score": round(float(row["confidence_score"]), 3),
            })

        return {
            "topic_id": topic_id,
            "topic_name": topic["name"],
            "prerequisites": prerequisites
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# PDF RESOURCE VAULT
# ============================================================

class ResourceCreate(BaseModel):
    circle_id: str
    user_id: str
    name: str
    url: str
    mimetype: str
    size_bytes: int


@router.post("/resource")
def create_resource(req: ResourceCreate):
    if req.mimetype != "application/pdf":
        api_error("INVALID_FILE_TYPE", "Only PDF files are allowed in the vault.")
    try:
        resp = supabase.table("resources").insert({
            "circle_id": req.circle_id,
            "user_id": req.user_id,
            "name": req.name,
            "url": req.url,
            "mimetype": req.mimetype,
            "size_bytes": req.size_bytes,
            "type": "file"
        }).execute()
        if not resp.data:
            api_error("RESOURCE_CREATE_FAILED", "Failed to log resource metadata.")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/circle/{circle_id}/resources")
def get_circle_resources(circle_id: str):
    try:
        resp = (
            supabase.table("resources")
            .select("*")
            .eq("circle_id", circle_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data
    except Exception as e:
        return {"error": str(e)}


# ============================================================
# COMMUNITY QUIZ
# ============================================================

class QuizGenerateRequest(BaseModel):
    circle_id: str
    topic_id: str
    course_code: str
    created_by: str


@router.post("/quiz/generate")
def generate_quiz(req: QuizGenerateRequest):
    """
    Enqueues quiz generation for the given topic.
    Creates the quiz record immediately; questions are added by ML pipeline.
    Returns quiz_id so client can poll/subscribe.
    """
    try:
        # Verify membership
        member_check = (
            supabase.table("circle_members")
            .select("user_id")
            .eq("circle_id", req.circle_id)
            .eq("user_id", req.created_by)
            .execute()
        )
        if not member_check.data:
            api_error("NOT_A_CIRCLE_MEMBER", "You are not a member of this circle", 403)

        # Check retake window: has this circle already done a quiz for this topic in the last 48h?
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=QUIZ_RETAKE_HOURS)).isoformat()
        recent_quiz = (
            supabase.table("quizzes")
            .select("id, created_at")
            .eq("circle_id", req.circle_id)
            .eq("topic_id", req.topic_id)
            .gte("created_at", cutoff)
            .execute()
        )
        if recent_quiz.data:
            retry_after = (
                datetime.fromisoformat(recent_quiz.data[0]["created_at"].replace("Z", "+00:00"))
                + timedelta(hours=QUIZ_RETAKE_HOURS)
            ).isoformat()
            api_error(
                "QUIZ_RETAKE_TOO_SOON",
                f"You can retake this quiz after {QUIZ_RETAKE_HOURS} hours.",
                429,
                retry_after
            )

        now = datetime.now(timezone.utc)
        closes_at = (now + timedelta(minutes=QUIZ_WINDOW_MINUTES)).isoformat()

        quiz_resp = supabase.table("quizzes").insert({
            "circle_id": req.circle_id,
            "topic_id": req.topic_id,
            "course_code": req.course_code,
            "created_by": req.created_by,
            "closes_at": closes_at
        }).execute()

        if not quiz_resp.data:
            api_error("QUIZ_CREATE_FAILED", "Failed to create quiz")

        quiz = quiz_resp.data[0]

        return {
            "quiz_id": quiz["id"],
            "closes_at": quiz["closes_at"],
            "status": "generating"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: str, user_id: Optional[str] = None):
    """Returns quiz questions for a circle member. Omits correct_index."""
    try:
        quiz_resp = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
        if not quiz_resp.data:
            api_error("QUIZ_NOT_FOUND", "Quiz not found", 404)

        quiz = quiz_resp.data[0]

        # Verify membership if user_id provided
        if user_id:
            member_check = (
                supabase.table("circle_members")
                .select("user_id")
                .eq("circle_id", quiz["circle_id"])
                .eq("user_id", user_id)
                .execute()
            )
            if not member_check.data:
                api_error("NOT_A_CIRCLE_MEMBER", "You are not a member of this circle", 403)

        now = datetime.now(timezone.utc)
        closes_at = datetime.fromisoformat(quiz["closes_at"].replace("Z", "+00:00"))
        is_open = now < closes_at

        questions_resp = (
            supabase.table("quiz_questions")
            .select("id, question_text, options")
            .eq("quiz_id", quiz_id)
            .execute()
        )

        return {
            "quiz_id": quiz_id,
            "topic_id": quiz["topic_id"],
            "circle_id": quiz["circle_id"],
            "closes_at": quiz["closes_at"],
            "is_open": is_open,
            "questions": questions_resp.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class QuizSubmitRequest(BaseModel):
    user_id: str
    answers: List[int]


@router.post("/quiz/{quiz_id}/submit")
def submit_quiz(quiz_id: str, req: QuizSubmitRequest):
    """
    Submits answers, scores them, updates peer_difficulty, returns circle standings.
    """
    try:
        quiz_resp = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
        if not quiz_resp.data:
            api_error("QUIZ_NOT_FOUND", "Quiz not found", 404)
        quiz = quiz_resp.data[0]

        # Check window
        now = datetime.now(timezone.utc)
        closes_at = datetime.fromisoformat(quiz["closes_at"].replace("Z", "+00:00"))
        if now > closes_at:
            api_error("QUIZ_WINDOW_CLOSED", "The submission window for this quiz has closed.")

        # Check not already submitted
        existing = (
            supabase.table("quiz_submissions")
            .select("id")
            .eq("quiz_id", quiz_id)
            .eq("user_id", req.user_id)
            .execute()
        )
        if existing.data:
            api_error("ALREADY_SUBMITTED", "You have already submitted answers for this quiz.")

        # Fetch correct answers
        questions_resp = (
            supabase.table("quiz_questions")
            .select("id, correct_index")
            .eq("quiz_id", quiz_id)
            .execute()
        )
        questions = questions_resp.data or []
        score = sum(
            1
            for i, q in enumerate(questions)
            if i < len(req.answers) and req.answers[i] == q["correct_index"]
        )

        # Store submission
        supabase.table("quiz_submissions").insert({
            "quiz_id": quiz_id,
            "user_id": req.user_id,
            "answers": req.answers,
            "score": score
        }).execute()

        # Update peer_difficulty for this topic
        if questions:
            accuracy = score / len(questions)
            topic_resp = supabase.table("topics").select("peer_difficulty, peer_difficulty_score").eq("id", quiz["topic_id"]).execute()
            if topic_resp.data:
                t = topic_resp.data[0]
                current_diff = t.get("peer_difficulty") or t.get("peer_difficulty_score") or 0.5
                # Count prior submissions
                n_resp = (
                    supabase.table("quiz_submissions")
                    .select("id", count="exact")
                    .eq("quiz_id", quiz_id)
                    .execute()
                )
                n = (n_resp.count or 1) - 1  # exclude current
                new_diff = (current_diff * n + (1 - accuracy)) / (n + 1)
                # Update whichever column exists
                update_data = {}
                if "peer_difficulty" in t:
                    update_data["peer_difficulty"] = round(new_diff, 3)
                if "peer_difficulty_score" in t:
                    update_data["peer_difficulty_score"] = round(new_diff, 3)
                if update_data:
                    supabase.table("topics").update(update_data).eq("id", quiz["topic_id"]).execute()

        # Get circle standings
        all_submissions = (
            supabase.table("quiz_submissions")
            .select("user_id, score, users(name)")
            .eq("quiz_id", quiz_id)
            .order("score", desc=True)
            .execute()
        )
        standings = [
            {
                "user_id": s["user_id"],
                "name": s.get("users", {}).get("name", "Unknown") if s.get("users") else "Unknown",
                "score": s["score"],
                "rank": i + 1
            }
            for i, s in enumerate(all_submissions.data)
        ]

        return {
            "score": score,
            "total": len(questions),
            "circle_standings": standings
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/circle/{circle_id}/quizzes")
def get_circle_quizzes(circle_id: str):
    try:
        resp = (
            supabase.table("quizzes")
            .select("id, topic_id, course_code, created_at, closes_at, topics(name)")
            .eq("circle_id", circle_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [
            {
                "quiz_id": q["id"],
                "topic_id": q["topic_id"],
                "topic_name": q.get("topics", {}).get("name", "Unknown") if q.get("topics") else "Unknown",
                "course_code": q["course_code"],
                "created_at": q["created_at"],
                "closes_at": q["closes_at"],
            }
            for q in resp.data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# PRACTICE QUIZ  (GET /quiz/practice/{course_code})
# ============================================================

@router.get("/quiz/practice/{course_code}")
def get_practice_quiz(course_code: str, user_id: Optional[str] = None):
    """
    Returns up to 10 practice questions for a course.
    If user_id is provided, creates a session record in the 'quizzes' table.
    """
    import random as _random
    try:
        # 1. Fetch questions
        try:
            resp = (
                supabase.table("quiz_questions")
                .select("id, question_text, options, correct_index, explanation, topic_name, priority_weight, topic_id")
                .eq("course_code", course_code)
                .order("priority_weight", desc=True)
                .limit(10)
                .execute()
            )
        except Exception:
            resp = (
                supabase.table("quiz_questions")
                .select("id, question_text, options, correct_index, explanation, topic_name, topic_id")
                .eq("course_code", course_code)
                .limit(10)
                .execute()
            )

        data = resp.data or []
        _random.shuffle(data)

        # 2. Persist session if user_id exists (using the new schema provided by user)
        quiz_id = None
        if user_id and user_id != "undefined":
            try:
                # Get the most relevant topic_id from the first question if available
                first_topic_id = data[0].get("topic_id") if data else None
                
                insert_resp = supabase.table("quizzes").insert({
                    "user_id": user_id,
                    "course_code": course_code,
                    "topic_id": first_topic_id,
                    "total_questions": len(data),
                    "is_completed": False
                }).execute()
                
                if insert_resp.data:
                    quiz_id = insert_resp.data[0]["id"]
            except Exception as e:
                print(f"DEBUG: Failed to create practice quiz session record: {e}")
                # We don't fail the whole request if persistence fails, but we log it.

        return {
            "quiz_id": quiz_id,
            "course_code": course_code,
            "questions": [
                {
                    "id": q["id"],
                    "topic_name": q.get("topic_name") or "General",
                    "question": q.get("question_text") or q.get("question", ""),
                    "options": q.get("options") or [],
                    "correct_index": int(q.get("correct_index", 0)),
                    "explanation": q.get("explanation") or "",
                }
                for q in data
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SOCIAL
# ============================================================

class SocialRequest(BaseModel):
    sender_id: str
    receiver_id: str


class SocialRespond(BaseModel):
    request_id: str
    action: str


class NudgeRequest(BaseModel):
    sender_id: str
    receiver_id: str
    type: str
    session_id: str


@router.post("/social/request")
def send_friend_request(req: SocialRequest):
    if req.sender_id == req.receiver_id:
        api_error("SELF_FRIEND", "Cannot send friend request to yourself")
    try:
        supabase.table("friend_requests").insert({
            "sender_id": req.sender_id,
            "receiver_id": req.receiver_id,
            "status": "pending"
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social/respond")
def respond_friend_request(req: SocialRespond):
    try:
        resp = supabase.table("friend_requests").update({
            "status": req.action
        }).eq("id", req.request_id).execute()
        if not resp.data:
            api_error("REQUEST_NOT_FOUND", "Friend request not found", 404)
        request_data = resp.data[0]
        if req.action == "accepted":
            u1, u2 = request_data["sender_id"], request_data["receiver_id"]
            supabase.table("friendships").insert([
                {"user_id": u1, "friend_id": u2},
                {"user_id": u2, "friend_id": u1}
            ]).execute()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social/nudge")
def nudge_friend(req: NudgeRequest):
    try:
        supabase.table("nudges").insert({
            "sender_id": req.sender_id,
            "receiver_id": req.receiver_id,
            "type": req.type,
            "session_id": req.session_id
        }).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Register router
# ============================================================
app.include_router(router)

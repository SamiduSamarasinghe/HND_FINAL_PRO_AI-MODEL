from fastapi import APIRouter,UploadFile, File, HTTPException, Form, Query
from app.service.gemini_service import start_gemini_chat
from pydantic import BaseModel

router = APIRouter()

class Message(BaseModel):
    prompt: str

@router.post("/chat")
async def start_conversation(request:Message):
    try:
        return await start_gemini_chat(request.prompt)
    except Exception as error:
        print(f"Error {error}")
        return f"Failed to start Gemini conversation{error}"
from fastapi import APIRouter,UploadFile, File, HTTPException, Form, Query
from app.service.gemini_service import start_gemini_chat,start_grading
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

@router.post("/grade")
async def grade_papers(userid:str,file:UploadFile = File(...)):
    try:
        return await start_grading(userid,file)
    except Exception as error:
        print(f"Faild to grade {error}")
        return f"Faild to grade {error}"
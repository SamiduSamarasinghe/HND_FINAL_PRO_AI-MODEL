from fastapi import APIRouter
from app.service.feedback_service import get_all_feedback_for_user,get_all_feedback_subect_wise
from app.service.feedback_service import get_all_subjects_in_feedbacks

router = APIRouter()

@router.get("/feedbacks")
async def get_all_feedbacks(userid:str):
    try:
        return get_all_feedback_for_user(userid)
    except Exception as error:
        print(f"Error {error}")
        return f"Error getting feedback {error}"

@router.get("/feedbacks/filter")
async def get_all_feedback_for_subject(userid:str,subject:str):
    try:
        return get_all_feedback_subect_wise(userid,subject)

    except Exception as error:
        print(f"Error {error}")
        return f"Error getting feedback {error}"

@router.get("/feedbacks/subjects")
async def get_subjects_from_feedbacks(userid:str):
    try:
        return get_all_subjects_in_feedbacks(userid)

    except Exception as error:
        print(f"Error {error}")
        return f"Error getting feedback {error}"


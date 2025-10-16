from fastapi import APIRouter, HTTPException, Depends
from typing import List
import traceback

from app.model.test_models import TestGenerationRequest, GeneratedTest, QuestionType
from app.service.test_generation_service import TestGenerationService

router = APIRouter()

#Initialize service instance
try:
    test_service = TestGenerationService()
    print("TestGenerationService initialized successfully")

except Exception as e:
    print(f"Failed to initialize TestGenerationService: {e}")
    test_service = None

# Mock user authentication (replace with real auth later)
def get_current_user():
    # TODO: Implement proper authentication
    return "user_123"

@router.post("/generate-test", response_model=GeneratedTest)
async def generate_mock_test(
        request: TestGenerationRequest,
        current_user: str = Depends(get_current_user)
):
    """
    Generate a mock test based on subject and criteria
    """
    try:
        #Check if service initialized
        if test_service is None:
            raise HTTPException(status_code=500, detail="Test service not initia;ized")

        # Validate question types
        enabled_types = [qt for qt, enabled in request.question_types.items() if enabled]
        if not enabled_types:
            raise HTTPException(status_code=400, detail="At least one question type must be selected")

        # Validate question count
        if request.question_count < 1 or request.question_count > 50:
            raise HTTPException(status_code=400, detail="Question count must be between 1 and 50")

        print(f"Generating test with params: {request}")

        # Generate test
        test = test_service.generate_mock_test(request, current_user)

        return test

    except ValueError as e:
        print(f"ValueError in test generation: {e}")
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        print(f"Unexpected error in test generation: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Test generation failed: {str(e)}")

@router.get("/available-subjects")
async def get_available_subjects():
    """
    Get list of available subjects for test generation
    """
    try:
        subjects = test_service.get_available_subjects()
        return {"subjects": subjects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch subjects: {str(e)}")

@router.get("/question-types")
async def get_question_types():
    """
    Get available question types
    """
    return {
        "question_types": [
            {"type": "MCQ", "points": 2},
            {"type": "Short Answer", "points": 5},
            {"type": "Essay", "points": 10}
        ]
    }

@router.get("/subjects")
async def get_all_subjects():
    """
    Get all available subjects from Firebase
    """
    try:
        # Import your Firebase connector
        from app.config.firebase_connection import FirebaseConnector
        connector = FirebaseConnector()
        db = connector.get_connection()

        # Get all subjects from the 'subjects' collection
        subjects_ref = db.collection("subjects")
        docs = subjects_ref.stream()

        subjects = []
        for doc in docs:
            subject_data = doc.to_dict()
            subjects.append({
                "id": doc.id,
                "name": subject_data.get("name", doc.id),
                "description": subject_data.get("description", ""),
                "total_questions": subject_data.get("total_questions", 0)
            })

        return {"subjects": subjects}

    except Exception as e:
        print(f"Error fetching subjects: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch subjects: {str(e)}")

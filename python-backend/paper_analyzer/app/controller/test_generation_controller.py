from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict
import traceback

from firebase_admin import db
from datetime import datetime, timedelta
from app.config.firebase_connection import FirebaseConnector

from app.model.test_models import TestGenerationRequest, GeneratedTest, QuestionType
from app.service.frequency_analyizer import connector
from app.service.test_generation_service import TestGenerationService

router = APIRouter()

# Initialize firebase connector
connector = FirebaseConnector()
__db = connector.get_connection()

# Initialize service instance
try:
    test_service = TestGenerationService()
    print("TestGenerationService initialized successfully")

except Exception as e:
    print(f"Failed to initialize TestGenerationService: {e}")
    test_service = None

# Mock user authentication (replace with real auth later)
def get_current_user():
    # TODO: Implement proper authentication
    return "teacher_123"

@router.post("/generate-test", response_model=GeneratedTest)
async def generate_mock_test(
        request: TestGenerationRequest,
        current_user: str = Depends(get_current_user)
):
    """
    Generate a mock test based on subject and criteria
    """
    try:
        # Check if service initialized
        if test_service is None:
            raise HTTPException(status_code=500, detail="Test service not initialized")

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

@router.get("/questions")
async def get_questions_by_subject(subject: str = None):
    """
    Get questions by subject or all questions
    """
    try:
        from app.service.question_extraction_service import QuestionExtractionService
        extractor = QuestionExtractionService()
        if subject:
            #Get questions for specific subject
            questions = extractor.extract_question_from_firebase(subject)
            return {
                "questions": questions,
                "subject": subject,
                "count": len(questions)
            }
        else:
            #Get all questions from all subjects
            from app.config.firebase_connection import FirebaseConnector
            connector = FirebaseConnector()
            db = connector.get_connection()

            all_questions = []
            questions_ref = db.collection("questions")
            docs = questions_ref.stream()

            for doc in docs:
                question_data = doc.to_dict()
                question_data["id"] = doc.id
                all_questions.append(question_data)

            return {
                "questions": all_questions,
                "count": len(all_questions),
                "note": "All questions from all subjects"
            }
    except Exception as e:
        print(f"Error fetiching questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")

@router.get("/subjects")
async def get_all_subjects():
    """
    Get all available subjects from Firebase
    """
    try:
        from app.config.firebase_connection import FirebaseConnector
        connector = FirebaseConnector()
        db = connector.get_connection()

        #Get all subjects from the subjects collection
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

        #If no subjects found in subjects collection, try to extract from questions
        if not subjects:
            questions_ref = db.collection("questions")
            docs = questions_ref.stream()

            unique_subjects = set()
            for doc in docs:
                question_data = doc.to_dict()
                subject = question_data.get("subject")
                if subject:
                    unique_subjects.add(subject)
            subjects = [{"id": sub, "name": sub, "description": f"Questions for {sub}", "total_questions": 0}
                        for sub in unique_subjects]

        return {"subjects": subjects}

    except Exception as e:
        print(f"Error fetching subjects: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch subjects: {str(e)}")

@router.post("/questions/manual-upload")
async def manual_question_upload(request: dict):
    """
    Save manually created questions to firestore
    """
    try:
        questions = request.get("questions", [])
        subject = request.get("subject", [])

        print(f"Manual upload: {len(questions)} questions for subject: {subject}")

        if not questions:
            raise  HTTPException(status_code=400, detail="subject is required")

        #use existing save_structured_questions function
        from app.model.firebase_db_model import save_structured_questions

        #Process each question
        processed_questions = []
        for i, question_data in enumerate(questions):
            #Ensure the question has all required fields
            processed_question = {
                "text": question_data.get("text", ""),
                "type": question_data.get("type", "MCQ"),
                "subject": subject,  # Use the provided subject
                "points": question_data.get("points", 2),
                "options": question_data.get("options", []),
                "correct_answer": question_data.get("correct_answer", ""),
                "topic": question_data.get("topic", subject),
                "source": "manual_upload",
                "source_file": "Manual Entry"
            }
            processed_questions.append(processed_question)
            print(f"Question {i+1}: {processed_question['text'][:50]}...")

        #Save to firebase
        result = save_structured_questions(
            questions=processed_questions,
            subject=subject,
            source_file="manual_upload"
        )
        return {
            "message": f"Successfully uploaded {len(processed_questions)} questions to {subject}",
            "questions_uploaded": len(processed_questions),
            "subject": subject,
            "result": result
        }
    except Exception as e:
        print(f"Manual upload failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/questions/count")
async def get_total_questions_count():
    """Get total count of alll questions in the firebase"""
    try:
        from app.config.firebase_connection import FirebaseConnector
        connector = FirebaseConnector()
        db = connector.get_connection()

        #Count all questions in the quesstions collection
        questions_ref = db.collection("questions")
        docs = questions_ref.stream()

        total_count = 0
        for doc in docs:
            total_count += 1

        return {
            "total_questions": total_count,
            "message": f"Found {total_count} questions in database"
        }
    except Exception as e:
        print(f"Error counting questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to count questions: {str(e)}")

@router.get("/teacher/monthly-stats")
async def get_teacher_monthly_stats(teacher_id: str = Query(...)):
    """
    Get monthly statistics of teacher
    Returns: active class count, assignments created this month
    """
    try:
        from app.config.firebase_connection import FirebaseConnector
        connector = FirebaseConnector()
        db = connector.get_connection()

        #Get current month and year for filtering
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year

        print(f"Getting monthly stats for teacher: {teacher_id}, month: {current_month}/{current_year}")

        # 1. Count teacher's active classes (all classes for now)
        classes_ref = db.collection("classes")
        classes_query = classes_ref.where("teacherId", "==", teacher_id)
        classes_docs = classes_query.stream()

        active_classes_count = 0
        class_ids = []

        for doc in classes_docs:
            active_classes_count += 1
            class_ids.append(doc.id)

        # 2. Count assignments created this month by this teacher
        assignments_ref = db.collection("assignments")
        assignments_query = assignments_ref.where("teacherId", "==", teacher_id)
        assignments_docs = assignments_query.stream()

        monthly_assignments_count = 0
        total_assignments_count = 0

        for doc in assignments_docs:
            assignment_data = doc.to_dict()
            total_assignments_count += 1

            # Check if assignment was created this month
            created_at = assignment_data.get("created", "")
            if created_at:
                try:
                    # Parse the created date
                    if 'Z' in created_at:
                        created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    else:
                        created_date = datetime.fromisoformat(created_at)

                    # Check if same month and year
                    if created_date.month == current_month and created_date.year == current_year:
                        monthly_assignments_count += 1
                except Exception as date_error:
                    print(f"Date parsing error for assignment {doc.id}: {date_error}")
                    # If we can't parse the date, count it as current month to be safe
                    monthly_assignments_count += 1

        return {
            "teacher_id": teacher_id,
            "active_classes": active_classes_count,
            "monthly_assignments": monthly_assignments_count,
            "total_assignments": total_assignments_count,
            "month": f"{current_month}/{current_year}",
            "class_ids": class_ids  # Return for potential frontend use
        }

    except Exception as e:
        print(f"Error getting teacher monthly stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get teacher stats: {str(e)}")

@router.get("/teacher/recent-engagement")
async def get_teacher_recent_engagement(teacher_id: str = Query(...), days: int = Query(7)):
    """
    Get student engagement for teacher's classes in last N days
    Returns: percentage of students who submitted anything in last 7 days
    """
    try:
        from app.config.firebase_connection import FirebaseConnector
        connector = FirebaseConnector()
        db = connector.get_connection()

        print(f"Getting engagement for teacher: {teacher_id}, last {days} days")

        # 1. Get all classes for this teacher
        classes_ref = db.collection("classes")
        classes_query = classes_ref.where("teacherId", "==", teacher_id)
        classes_docs = classes_query.stream()

        total_students = 0
        active_students = 0
        student_emails = set()

        for class_doc in classes_docs:
            class_data = class_doc.to_dict()
            students = class_data.get("students", [])

            for student in students:
                student_email = student.get("email")
                if student_email:
                    student_emails.add(student_email)
                    total_students += 1

        # 2. Check which students submitted in last 7 days
        if total_students > 0:
            # Calculate cutoff date (7 days ago)
            cutoff_date = datetime.now() - timedelta(days=days)

            # Check submissions for each student
            submissions_ref = db.collection("submissions")
            for student_email in student_emails:
                try:
                    # Query submissions for this student in last 7 days
                    submissions_query = submissions_ref.where("studentEmail", "==", student_email)
                    submissions_docs = submissions_query.stream()

                    for doc in submissions_docs:
                        submission_data = doc.to_dict()
                        submitted_at = submission_data.get("submittedAt", "")

                        if submitted_at:
                            try:
                                # Parse submission date
                                if 'Z' in submitted_at:
                                    submit_date = datetime.fromisoformat(submitted_at.replace('Z', '+00:00'))
                                else:
                                    submit_date = datetime.fromisoformat(submitted_at)

                                # Check if within last 7 days
                                if submit_date >= cutoff_date:
                                    active_students += 1
                                    break  # Student is active, move to next student
                            except Exception as date_error:
                                print(f"Date parsing error for submission {doc.id}: {date_error}")
                                # If we can't parse date, count as active to be safe
                                active_students += 1
                                break
                except Exception as e:
                    print(f"Error checking submissions for {student_email}: {e}")
                    continue

        # Calculate engagement percentage
        engagement_percentage = 0
        if total_students > 0:
            engagement_percentage = round((active_students / total_students) * 100)

        return {
            "teacher_id": teacher_id,
            "total_students": total_students,
            "active_students": active_students,
            "engagement_percentage": engagement_percentage,
            "period_days": days
        }

    except Exception as e:
        print(f"Error getting teacher engagement: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get engagement data: {str(e)}")
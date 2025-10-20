from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import traceback

from firebase_admin import db
from datetime import datetime
from app.config.firebase_connection import FirebaseConnector

from app.model.test_models import TestGenerationRequest, GeneratedTest, QuestionType
from app.service.frequency_analyizer import connector
from app.service.test_generation_service import TestGenerationService

router = APIRouter()

#Initialize firebase connector
connector = FirebaseConnector()
__db = connector.get_connection()

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

from typing import List, Dict, Any
from datetime import datetime

# Add these endpoints to your test_generation_controller.py

@router.get("/teacher/classes")
async def get_teacher_classes(current_user: str = Depends(get_current_user)):
    """
    Get all classes for the current teacher
    """
    try:
        print(f"Fetching classes for teacher: {current_user}")

        # Get classes from Firestore
        classes_ref = __db.collection("classes")
        query = classes_ref.where("teacherId", "==", current_user)
        docs = query.stream()

        classes = []
        for doc in docs:
            class_data = doc.to_dict()
            class_data["id"] = doc.id
            classes.append(class_data)

        print(f"Found {len(classes)} classes for teacher {current_user}")
        return {"classes": classes}

    except Exception as e:
        print(f"Error fetching classes: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch classes: {str(e)}")

@router.post("/teacher/classes")
async def create_class(class_data: dict, current_user: str = Depends(get_current_user)):
    """
    Create a new class
    """
    try:
        print(f"Creating class for teacher: {current_user}")
        print(f"Class data: {class_data}")

        class_ref = __db.collection("classes").document()

        class_doc = {
            "id": class_ref.id,
            "name": class_data.get("name"),
            "subject": class_data.get("subject"),
            "gradeLevel": class_data.get("gradeLevel", "10"),
            "description": class_data.get("description", ""),
            "teacherId": current_user,
            "students": [],
            "createdAt": datetime.now().isoformat()
        }

        class_ref.set(class_doc)
        print(f"Class created successfully")

        return {
            "message": "Class created successfully",
            "classId": class_ref.id,
            "class": class_doc
        }

    except Exception as e:
        print(f"Error creating class: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create class: {str(e)}")

@router.post("/teacher/classes/{class_id}/students")
async def add_student_to_class(class_id: str, student_data: dict, current_user: str = Depends(get_current_user)):
    """
    Add a student to a class
    """
    try:
        print(f"Adding student to class {class_id}")
        print(f"Student data: {student_data}")

        class_ref = __db.collection("classes").document(class_id)
        class_doc = class_ref.get()

        if not class_doc.exists:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = class_doc.to_dict()

        # Verify the teacher owns this class
        if class_data.get("teacherId") != current_user:
            raise HTTPException(status_code=403, detail="Not authorized to modify this class")

        # Generate student ID or use existing
        student_id = f"student_{int(datetime.now().timestamp())}"

        student = {
            "id": student_id,
            "name": student_data.get("name"),
            "email": student_data.get("email"),
            "addedAt": datetime.now().isoformat()
        }

        # Add student to class
        if "students" not in class_data:
            class_data["students"] = []

        #Check if student already exists
        existing_student = next((s for s in class_data["students"] if s.get("email") == student["email"]), None)
        if existing_student:
            raise HTTPException(status_code=400, detail="Student already exists in this class")

        class_data["students"].append(student)
        class_ref.update({"students": class_data["students"]})

        print(f"Student added successfully: {student_id}")
        return {
            "message": "Student added successfully",
            "student": student
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding student: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to add student: {str(e)}")

@router.delete("/teacher/classes/{class_id}/students/{student_id}")
async def remove_student_from_class(class_id: str, student_id: str, current_user: str = Depends(get_current_user)):
    """
    Remove a student from a class
    """
    try:
        print(f"Removing student {student_id} from class {class_id}")

        class_ref = __db.collection("classes").document(class_id)
        class_doc = class_ref.get()

        if not class_doc.exists:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = class_doc.to_dict()

        # Verify the teacher owns this class
        if class_data.get("teacherId") != current_user:
            raise HTTPException(status_code=403, detail="Not authorized to modify this class")

        # Remove student from class
        if "students" in class_data:
            original_count = len(class_data["students"])
            class_data["students"] = [s for s in class_data["students"] if s.get("id") != student_id]

            if len(class_data["students"]) == original_count:
                raise HTTPException(status_code=404, detail="Student not found in class")

            class_ref.update({"students": class_data["students"]})

        print(f"✅ Student removed successfully")
        return {"message": "Student removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error removing student: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to remove student: {str(e)}")

@router.post("/teacher/assignments")
async def create_assignment(assignment_data: dict, current_user: str = Depends(get_current_user)):
    """Create new assignment for a class"""
    try:
        print(f"Creating assignment for teacher: {current_user}")
        print(f"Assignment data: {assignment_data}")

        assignment_ref = __db.collection("assignments").document()

        assignment_doc = {
            "id": assignment_ref.id,
            "classId": assignment_data.get("classId"),
            "title": assignment_data.get("title"),
            "content": assignment_data.get("content", ""),
            "type": assignment_data.get("type", "text"),
            "pdfUrl": assignment_data.get("pdfUrl", ""),
            "pdfFile": assignment_data.get("pdfFile", ""),  # Add this line
            "questions": assignment_data.get("questions", []),  # Ensure questions are saved
            "dueDate": assignment_data.get("dueDate"),
            "created": datetime.now().isoformat(),
            "teacherId": current_user
        }

        print(f"📝 Saving assignment to Firebase: {assignment_doc}")  # Debug log

        assignment_ref.set(assignment_doc)
        print(f"Assignment created successfully: {assignment_ref.id}")

        return {
            "message": "Assignment created successfully",
            "assignmentId": assignment_ref.id,
            "assignment": assignment_doc
        }
    except Exception as e:
        print(f"Error creating assignment: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")

@router.get("/teacher/assignments/{class_id}")
async def get_class_assignments(class_id: str, current_user: str = Depends(get_current_user)):
    """
    Get all assignments for a specific class
    """
    try:
        print(f"Fetching assignments for class: {class_id}")

        assignments_ref = __db.collection("assignments")
        query = assignments_ref.where("classId", "==", class_id)
        docs = query.stream()

        assignments = []
        for doc in docs:
            assignment_data = doc.to_dict()
            assignment_data["id"] = doc.id
            assignments.append(assignment_data)

        print(f"Found {len(assignments)} assignments for class {class_id}")
        return {"assignments": assignments}

    except Exception as e:
        print(f"Error fetching assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignments: {str(e)}")
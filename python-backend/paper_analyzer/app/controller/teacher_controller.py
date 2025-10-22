from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from datetime import datetime
import traceback

from app.config.firebase_connection import FirebaseConnector

router = APIRouter()
connector = FirebaseConnector()
__db = connector.get_connection()

# Mock user authentication
def get_current_user():
    # TODO: Implement proper authentication
    return "teacher_123"

# Move all teacher endpoints from test_generation_controller.py to here

@router.get("/teacher/classes")
async def get_teacher_classes(current_user: str = Depends(get_current_user)):
    """Get all classes for the current teacher"""
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
    """Create a new class"""
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
    """Add a student to a class"""
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

        # Check if student already exists
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
    """Remove a student from a class"""
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
            "pdfFile": assignment_data.get("pdfFile", ""),
            "questions": assignment_data.get("questions", []),
            "dueDate": assignment_data.get("dueDate"),
            "created": datetime.now().isoformat(),
            "teacherId": current_user
        }

        print(f"📝 Saving assignment to Firebase: {assignment_doc}")

        assignment_ref.set(assignment_doc)
        print(f"Assignment created successfully: {assignment_ref.id}")

        # CREATE NOTIFICATIONS FOR STUDENTS
        await create_student_notifications(
            class_id=assignment_data.get("classId"),
            assignment_id=assignment_ref.id,
            assignment_title=assignment_data.get("title"),
            due_date=assignment_data.get("dueDate")
        )

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
    """Get all assignments for a specific class"""
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

async def create_student_notifications(class_id: str, assignment_id: str, assignment_title: str, due_date: str):
    """Create notifications for all students in a class when assignment is created"""
    try:
        # Get class details
        class_ref = __db.collection("classes").document(class_id)
        class_doc = class_ref.get()

        if not class_doc.exists:
            print(f"Class {class_id} not found")
            return

        class_data = class_doc.to_dict()
        students = class_data.get("students", [])

        # Create notifications for each student
        for student in students:
            notification_ref = __db.collection("student_notifications").document()
            notification_data = {
                "id": notification_ref.id,
                "studentEmail": student.get("email"),
                "assignmentId": assignment_id,
                "classId": class_id,
                "assignmentTitle": assignment_title,
                "dueDate": due_date,
                "isSeen": False,
                "createdAt": datetime.now().isoformat()
            }
            notification_ref.set(notification_data)
            print(f"Created notification for student: {student.get('email')}")

    except Exception as e:
        print(f"Error creating student notifications: {str(e)}")

@router.get("/teacher/download-pdf/{submission_id}")
async def download_submission_pdf(submission_id: str, current_user: str = Depends(get_current_user)):
    """Download PDF for a specific submission (for teachers)"""
    try:
        submission_ref = __db.collection("submissions").document(submission_id)
        submission_doc = submission_ref.get()

        if not submission_doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found")

        submission_data = submission_doc.to_dict()
        pdf_base64 = submission_data.get("pdfBase64")

        if not pdf_base64:
            raise HTTPException(status_code=404, detail="PDF not found")

        return {
            "file_name": submission_data.get("fileName", "submission.pdf"),
            "file_content": pdf_base64,
            "content_type": "application/pdf"
        }

    except Exception as e:
        print(f"❌ Error downloading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download PDF: {str(e)}")

# Teacher submission grading endpoints
@router.get("/teacher/submissions/{assignment_id}")
async def get_assignment_submissions(assignment_id: str, current_user: str = Depends(get_current_user)):
    """Get all submissions for a specific assignment"""
    try:
        submissions_ref = __db.collection("submissions")
        query = submissions_ref.where("assignmentId", "==", assignment_id)
        docs = query.stream()

        submissions = []
        for doc in docs:
            submission_data = doc.to_dict()
            submission_data["id"] = doc.id
            submissions.append(submission_data)

        # Get assignment details
        assignment_ref = __db.collection("assignments").document(assignment_id)
        assignment_doc = assignment_ref.get()
        assignment_data = assignment_doc.to_dict() if assignment_doc.exists else {}

        return {
            "assignment": assignment_data,
            "submissions": submissions,
            "total_submissions": len(submissions)
        }

    except Exception as e:
        print(f"Error fetching submissions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {str(e)}")

@router.put("/teacher/grade-submission")
async def grade_submission(grade_data: dict, current_user: str = Depends(get_current_user)):
    """Grade a submission"""
    try:
        submission_id = grade_data.get("submissionId")
        grade = grade_data.get("grade")
        feedback = grade_data.get("feedback", "")

        if not submission_id or grade is None:
            raise HTTPException(status_code=400, detail="Submission ID and grade are required")

        submission_ref = __db.collection("submissions").document(submission_id)
        submission_doc = submission_ref.get()

        if not submission_doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Update submission
        updates = {
            "grade": grade,
            "teacherFeedback": feedback,
            "status": "graded",
            "gradedAt": datetime.now().isoformat()
        }

        submission_ref.update(updates)

        return {
            "message": "Submission graded successfully",
            "submission_id": submission_id,
            "grade": grade
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error grading submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to grade submission: {str(e)}")
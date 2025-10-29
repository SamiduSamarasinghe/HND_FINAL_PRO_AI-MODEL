from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Dict
import traceback
from datetime import datetime, timezone, timedelta
import base64
import uuid

from app.config.firebase_connection import FirebaseConnector

from app.controller.teacher_controller import get_current_user
from app.model.firebase_db_model import get_students_with_feedback

router = APIRouter()
connector = FirebaseConnector()
__db = connector.get_connection()

def get_current_user_email():
    return "student@example.com"

@router.get("/student/notifications/{student_email}")
async def get_student_notifications(student_email: str):
    """Get unread notifications for student with types"""
    try:
        notifications_ref = __db.collection("student_notifications")
        query = notifications_ref.where("studentEmail", "==", student_email).where("isSeen", "==", False)
        docs = query.stream()

        notifications = []
        for doc in docs:
            notification_data = doc.to_dict()
            notification_data["id"] = doc.id
            notifications.append(notification_data)

        return {
            "unread_count": len(notifications),
            "notifications": notifications
        }

    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@router.get("/student/assignments/{class_id}")
async def get_class_assignments(class_id: str, student_email: str):
    """Get all assignments for a class with student submission status"""
    try:
        print(f"Fetching assignments for class: {class_id}, student: {student_email}")

        assignments_ref = __db.collection("assignments")
        query = assignments_ref.where("classId", "==", class_id)
        assignment_docs = query.stream()

        assignments = []
        for doc in assignment_docs:
            assignment_data = doc.to_dict()
            assignment_data["id"] = doc.id

            # Check if student has submitted
            submissions_ref = __db.collection("submissions")
            submission_query = submissions_ref.where("assignmentId", "==", doc.id).where("studentEmail", "==", student_email)
            submission_docs = submission_query.stream()

            submission_data = None
            for sub_doc in submission_docs:
                submission_data = sub_doc.to_dict()
                submission_data["submissionId"] = sub_doc.id
                break

            # Check if assignment is late - FIXED DATETIME COMPARISON
            is_late = False
            can_submit = True  # Always allow submission

            try:
                due_date_str = assignment_data.get("dueDate", "")
                if due_date_str:
                    # Parse due date and make it timezone-aware
                    if 'Z' in due_date_str:
                        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                    else:
                        due_date = datetime.fromisoformat(due_date_str)
                        if due_date.tzinfo is None:
                            due_date = due_date.replace(tzinfo=timezone.utc)

                    current_time = datetime.now(timezone.utc)
                    is_late = current_time > due_date
                    # Always allow submission, even if late
                    can_submit = not submission_data
            except Exception as date_error:
                print(f"Date parsing error: {date_error}")
                can_submit = not submission_data

            assignment_data["submission"] = submission_data
            assignment_data["is_late"] = is_late
            assignment_data["can_submit"] = can_submit
            assignment_data["classId"] = class_id

            assignments.append(assignment_data)

        print(f"Found {len(assignments)} assignments")
        return {"assignments": assignments}

    except Exception as e:
        print(f"Error fetching assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignments: {str(e)}")

@router.post("/student/submit-pdf")
async def submit_pdf_assignment(
        assignment_id: str = Form(...),
        student_email: str = Form(...),
        student_name: str = Form(...),
        class_id: str = Form(...),
        file: UploadFile = File(...)
):
    """Submit PDF assignment - Store PDF as base64 in Firestore"""
    try:
        print(f"Student {student_email} submitting assignment {assignment_id}")

        # Check if assignment exists
        assignment_ref = __db.collection("assignments").document(assignment_id)
        assignment_doc = assignment_ref.get()

        if not assignment_doc.exists:
            raise HTTPException(status_code=404, detail="Assignment not found")

        assignment_data = assignment_doc.to_dict()
        due_date_str = assignment_data["dueDate"]

        # Check if already submitted
        submissions_ref = __db.collection("submissions")
        existing_query = submissions_ref.where("assignmentId", "==", assignment_id).where("studentEmail", "==", student_email)
        existing_docs = existing_query.stream()

        for doc in existing_docs:
            raise HTTPException(status_code=400, detail="Assignment already submitted")

        # Read and encode PDF file as base64
        file_content = await file.read()
        pdf_base64 = base64.b64encode(file_content).decode('utf-8')

        # Check if submission is late - FIXED DATETIME COMPARISON
        current_time = datetime.now(timezone.utc)

        # Parse due date and make it timezone-aware
        if 'Z' in due_date_str:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        else:
            due_date = datetime.fromisoformat(due_date_str)
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

        is_late = current_time > due_date
        days_late = (current_time - due_date).days if is_late else 0

        # Create submission record with PDF stored as base64
        submission_ref = __db.collection("submissions").document()
        submission_data = {
            "id": submission_ref.id,
            "assignmentId": assignment_id,
            "studentEmail": student_email,
            "studentName": student_name,
            "classId": class_id,
            "fileName": file.filename,
            "fileSize": len(file_content),
            "pdfBase64": pdf_base64,
            "submittedAt": current_time.isoformat(),
            "status": "submitted",
            "isLate": is_late,
            "daysLate": days_late,
            "grade": None,
            "teacherFeedback": ""
        }

        submission_ref.set(submission_data)

        # Mark notification as seen
        notifications_ref = __db.collection("student_notifications")
        notification_query = notifications_ref.where("assignmentId", "==", assignment_id).where("studentEmail", "==", student_email)
        notification_docs = notification_query.stream()

        for notification_doc in notification_docs:
            notification_ref = __db.collection("student_notifications").document(notification_doc.id)
            notification_ref.update({"isSeen": True})

        print(f"Assignment submitted successfully! Late: {is_late}")

        return {
            "message": "Assignment submitted successfully" + (" (Late)" if is_late else ""),
            "submission_id": submission_ref.id,
            "file_name": file.filename,
            "is_late": is_late
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting assignment: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to submit assignment: {str(e)}")

@router.post("/student/classes")
async def get_student_classes(request: dict):
    """Get all classes where a student is enrolled"""
    try:
        student_email = request.get("studentEmail")

        if not student_email:
            raise HTTPException(status_code=400, detail="Student email is required")

        print(f"🎓 Fetching classes for student: {student_email}")

        classes_ref = __db.collection("classes")
        classes_docs = classes_ref.stream()

        student_classes = []

        for doc in classes_docs:
            class_data = doc.to_dict()
            class_data["id"] = doc.id

            students = class_data.get("students", [])
            student_in_class = any(student.get("email") == student_email for student in students)

            if student_in_class:
                student_classes.append(class_data)

        return {
            "student_email": student_email,
            "classes": student_classes,
            "total_classes": len(student_classes)
        }

    except Exception as e:
        print(f"Error fetching student classes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch student classes: {str(e)}")

@router.get("/student/submissions/{student_email}")
async def get_student_submissions(student_email: str):
    """Get all submissions by student"""
    try:
        submissions_ref = __db.collection("submissions")
        query = submissions_ref.where("studentEmail", "==", student_email)
        docs = query.stream()

        submissions = []
        for doc in docs:
            submission_data = doc.to_dict()
            submission_data["id"] = doc.id

            # Get assignment details
            assignment_ref = __db.collection("assignments").document(submission_data["assignmentId"])
            assignment_doc = assignment_ref.get()
            if assignment_doc.exists:
                assignment_data = assignment_doc.to_dict()
                submission_data["assignmentTitle"] = assignment_data.get("title", "Unknown Assignment")
                submission_data["assignmentDueDate"] = assignment_data.get("dueDate")

            # Don't include the base64 PDF in the list to reduce data transfer
            if "pdfBase64" in submission_data:
                submission_data["hasPdf"] = True
                del submission_data["pdfBase64"]
            else:
                submission_data["hasPdf"] = False

            submissions.append(submission_data)

        return {"submissions": submissions}

    except Exception as e:
        print(f"Error fetching submissions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {str(e)}")

@router.get("/student/download-pdf/{submission_id}")
async def download_submission_pdf(submission_id: str):
    """Download PDF for a specific submission"""
    try:
        submission_ref = __db.collection("submissions").document(submission_id)
        submission_doc = submission_ref.get()

        if not submission_doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found")

        submission_data = submission_doc.to_dict()
        pdf_base64 = submission_data.get("pdfBase64")

        if not pdf_base64:
            raise HTTPException(status_code=404, detail="PDF not found")

        # Decode base64 back to bytes
        pdf_bytes = base64.b64decode(pdf_base64)

        return {
            "file_name": submission_data.get("fileName", "submission.pdf"),
            "file_content": pdf_base64,  # Return as base64 for frontend
            "content_type": "application/pdf"
        }

    except Exception as e:
        print(f"Error downloading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download PDF: {str(e)}")

@router.get("/student/events/{student_email}")
async def get_student_events(student_email: str):
    """Get events for student"""
    try:
        from app.model.firebase_db_model import get_events_for_user
        events = get_events_for_user(
            user_email=student_email,
            user_role="student"
        )
        return {"events": events}

    except Exception as e:
        print(f"Error fetching student events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")


@router.get("/students")
async def get_all_students_with_feedback():
    """Get all students who have submitted feedback/papers"""
    try:
        students = get_students_with_feedback()
        return {"students": students}
    except Exception as error:
        print(f"Error fetching students: {error}")
        return {"students": []}
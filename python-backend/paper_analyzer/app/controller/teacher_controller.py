from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
import uuid
import traceback
from firebase_admin import firestore
from app.config.firebase_connection import FirebaseConnector

router = APIRouter()
connector = FirebaseConnector()
__db = connector.get_connection()

#get user id from query params
async def get_current_user(request: Request):
    """Get user id from query parameters"""
    teacher_id = request.query_params.get("teacher_id")
    if not teacher_id:
        raise HTTPException(status_code=401, detail="Teacher ID required")
    return teacher_id


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
                "type": "new_assignment",
                "message": f"New assignment: {assignment_title}. Due: {due_date}",
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
        achieved_grade = grade_data.get("achievedGrade")
        total_grade = grade_data.get("totalGrade")
        feedback = grade_data.get("feedback", "")

        if not submission_id or achieved_grade is None or total_grade is None:
            raise HTTPException(status_code=400, detail="Submission ID, achieved grade, and total grade are required")

        # Validate grades
        try:
            achieved_grade = int(achieved_grade)
            total_grade = int(total_grade)
            if achieved_grade < 0 or total_grade <= 0 or achieved_grade > total_grade:
                raise ValueError("Invalid grade values")

        except ValueError:
            raise HTTPException(status_code=400, detail="Grades must be valid positive integers")

        submission_ref = __db.collection("submissions").document(submission_id)
        submission_doc = submission_ref.get()

        if not submission_doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Update submission
        updates = {
            "achievedGrade": achieved_grade,
            "totalGrade": total_grade,
            "grade": f"{achieved_grade}/{total_grade}",
            "teacherFeedback": feedback,
            "status": "graded",
            "gradedAt": datetime.now().isoformat(),
            "gradedBy": current_user
        }

        submission_ref.update(updates)

        # Create graded notification for student
        submission_data = submission_doc.to_dict()
        notification_ref = __db.collection("student_notifications").document()
        notification_data = {
            "id": notification_ref.id,
            "studentEmail": submission_data.get("studentEmail"),
            "assignmentId": submission_data.get("assignmentId"),
            "assignmentTitle": "Your assignment has been graded",  # We'll get the actual title below
            "type": "graded",
            "message": f"Your submission has been graded: {achieved_grade}/{total_grade}. {feedback}",
            "isSeen": False,
            "createdAt": datetime.now().isoformat()
        }

        # Get assignment title for the notification
        assignment_ref = __db.collection("assignments").document(submission_data.get("assignmentId"))
        assignment_doc = assignment_ref.get()
        if assignment_doc.exists:
            assignment_data = assignment_doc.to_dict()
            notification_data["assignmentTitle"] = assignment_data.get("title", "Assignment")

        notification_ref.set(notification_data)

        return {
            "message": "Submission graded successfully",
            "submission_id": submission_id,
            "grade": f"{achieved_grade}/{total_grade}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error grading submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to grade submission: {str(e)}")

@router.post("/teacher/send-reminder")
async def send_student_reminder(reminder_data: dict, current_user: str = Depends(get_current_user)):
    """Send reminder to student about missing assignment"""
    try:
        student_email = reminder_data.get("studentEmail")
        assignment_id = reminder_data.get("assignmentId")
        message = reminder_data.get("message", "Please submit your assignment as soon as possible.")

        if not student_email or not assignment_id:
            raise HTTPException(status_code=400, detail="Student email and assignment ID are required")

        # Get assignment details
        assignment_ref = __db.collection("assignments").document(assignment_id)
        assignment_doc = assignment_ref.get()

        if not assignment_doc.exists:
            raise HTTPException(status_code=404, detail="Assignment not found")

        assignment_data = assignment_doc.to_dict()

        # Create reminder notification
        notification_ref = __db.collection("student_notifications").document()
        notification_data = {
            "id": notification_ref.id,
            "studentEmail": student_email,
            "assignmentId": assignment_id,
            "assignmentTitle": assignment_data.get("title", "Assignment"),
            "type": "reminder",
            "message": message,
            "isSeen": False,
            "createdAt": datetime.now().isoformat(),
            "sentByTeacher": current_user
        }

        notification_ref.set(notification_data)

        # Track reminder count for student (for chronic late tracking)
        student_reminders_ref = __db.collection("student_reminder_tracking").document(f"{student_email}_{assignment_id}")
        student_reminders_doc = student_reminders_ref.get()

        if student_reminders_doc.exists:
            student_reminders_ref.update({"reminderCount": firestore.Increment(1)})
        else:
            student_reminders_ref.set({
                "studentEmail": student_email,
                "assignmentId": assignment_id,
                "assignmentTitle": assignment_data.get("title", "Assignment"),
                "reminderCount": 1,
                "firstReminderAt": datetime.now().isoformat(),
                "lastReminderAt": datetime.now().isoformat()
            })

        return {
            "message": "Reminder sent successfully",
            "notification_id": notification_ref.id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending reminder: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send reminder: {str(e)}")

@router.get("/teacher/late-submissions/{class_id}")
async def get_late_submissions(class_id: str, current_user: str = Depends(get_current_user)):
    """Get late and missing submissions for a class"""
    try:
        print(f"Fetching late submissions for class: {class_id}, teacher: {current_user}")

        # Get class details
        class_ref = __db.collection("classes").document(class_id)
        class_doc = class_ref.get()

        if not class_doc.exists:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = class_doc.to_dict()

        # Verify the teacher owns this class
        if class_data.get("teacherId") != current_user:
            raise HTTPException(status_code=403, detail="Not authorized to access this class")

        # Get all assignments for this class
        assignments_ref = __db.collection("assignments")
        assignments_query = assignments_ref.where("classId", "==", class_id)
        assignments_docs = assignments_query.stream()

        late_missing_data = []

        for assignment_doc in assignments_docs:
            assignment_data = assignment_doc.to_dict()
            assignment_data["id"] = assignment_doc.id

            # Get all submissions for this assignment
            submissions_ref = __db.collection("submissions")
            submissions_query = submissions_ref.where("assignmentId", "==", assignment_doc.id)
            submissions_docs = submissions_query.stream()

            submitted_students = []
            for submission_doc in submissions_docs:
                submission_data = submission_doc.to_dict()
                submitted_students.append(submission_data["studentEmail"])

                # Check if submission is late and not graded
                if submission_data.get("isLate") and submission_data.get("status") != "graded":
                    # Get reminder count for this student
                    reminder_tracking_ref = __db.collection("student_reminder_tracking").document(f"{submission_data['studentEmail']}_{assignment_doc.id}")
                    reminder_tracking_doc = reminder_tracking_ref.get()
                    reminder_count = reminder_tracking_doc.to_dict().get("reminderCount", 0) if reminder_tracking_doc.exists else 0

                    # Calculate days late - FIXED: Handle date parsing safely
                    try:
                        due_date_str = assignment_data["dueDate"]
                        submitted_date_str = submission_data["submittedAt"]

                        # Parse dates safely
                        if 'Z' in due_date_str:
                            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                        else:
                            due_date = datetime.fromisoformat(due_date_str)
                            if due_date.tzinfo is None:
                                due_date = due_date.replace(tzinfo=timezone.utc)

                        if 'Z' in submitted_date_str:
                            submitted_date = datetime.fromisoformat(submitted_date_str.replace('Z', '+00:00'))
                        else:
                            submitted_date = datetime.fromisoformat(submitted_date_str)
                            if submitted_date.tzinfo is None:
                                submitted_date = submitted_date.replace(tzinfo=timezone.utc)

                        days_late = (submitted_date - due_date).days
                    except Exception as date_error:
                        print(f"Date parsing error: {date_error}")
                        days_late = 0  # Default to 0 if date parsing fails

                    late_missing_data.append({
                        "type": "late_submission",
                        "studentName": submission_data["studentName"],
                        "studentEmail": submission_data["studentEmail"],
                        "assignmentId": assignment_doc.id,
                        "assignmentTitle": assignment_data["title"],
                        "className": class_data["name"],
                        "dueDate": assignment_data["dueDate"],
                        "submittedAt": submission_data["submittedAt"],
                        "daysLate": days_late,
                        "reminderCount": reminder_count,
                        "submissionId": submission_doc.id,
                        "status": "late"
                    })

            # Find students who haven't submitted
            class_students = class_data.get("students", [])
            for student in class_students:
                if student.get("email") not in submitted_students:
                    # Check if assignment is past due
                    try:
                        due_date_str = assignment_data["dueDate"]
                        if 'Z' in due_date_str:
                            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                        else:
                            due_date = datetime.fromisoformat(due_date_str)
                            if due_date.tzinfo is None:
                                due_date = due_date.replace(tzinfo=timezone.utc)

                        current_date = datetime.now(timezone.utc)

                        if current_date > due_date:
                            # Get reminder count
                            reminder_tracking_ref = __db.collection("student_reminder_tracking").document(f"{student['email']}_{assignment_doc.id}")
                            reminder_tracking_doc = reminder_tracking_ref.get()
                            reminder_count = reminder_tracking_doc.to_dict().get("reminderCount", 0) if reminder_tracking_doc.exists else 0

                            days_late = (current_date - due_date).days

                            late_missing_data.append({
                                "type": "missing_submission",
                                "studentName": student["name"],
                                "studentEmail": student["email"],
                                "assignmentId": assignment_doc.id,
                                "assignmentTitle": assignment_data["title"],
                                "className": class_data["name"],
                                "dueDate": assignment_data["dueDate"],
                                "daysLate": days_late,
                                "reminderCount": reminder_count,
                                "status": "missing"
                            })
                    except Exception as date_error:
                        print(f"Date parsing error for missing submission: {date_error}")
                        continue

        print(f"Found {len(late_missing_data)} late/missing submissions for class {class_id}")

        return {
            "class_id": class_id,
            "class_name": class_data["name"],
            "late_missing_submissions": late_missing_data
        }

    except Exception as e:
        print(f"❌ Error fetching late submissions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch late submissions: {str(e)}")



@router.post("/teacher/events")
async def create_event(event_data: dict, current_user: str = Depends(get_current_user)):
    """Create a simple event"""
    try:
        # Validate required fields
        if not event_data.get("title") or not event_data.get("due_date"):
            raise HTTPException(status_code=400, detail="Title and due date are required")

        # Prepare event data
        event_payload = {
            "title": event_data.get("title"),
            "description": event_data.get("description", ""),
            "type": event_data.get("type", "general"),
            "due_date": event_data.get("due_date"),
            "priority": event_data.get("priority", "medium"),
            "target_type": event_data.get("target_type"),  # "class" or "individual"
            "target_emails": event_data.get("target_emails", []),
            "target_class_ids": event_data.get("target_class_ids", []),
            "created_by": current_user,
            "teacher_classes": event_data.get("teacher_classes", [])
        }

        # Save to Firebase
        from app.model.firebase_db_model import save_event
        result = save_event(event_payload)

        if result["success"]:
            return {
                "message": "Event created successfully",
                "event_id": result["event_id"]
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create event: {str(e)}")

@router.get("/teacher/events")
async def get_teacher_events(current_user: str = Depends(get_current_user)):
    """Get events for teacher"""
    try:
        from app.model.firebase_db_model import get_events_for_user
        events = get_events_for_user(
            user_email=current_user,  # Using teacher ID as email for simplicity
            user_role="teacher",
            teacher_id=current_user
        )
        return {"events": events}

    except Exception as e:
        print(f"Error fetching teacher events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
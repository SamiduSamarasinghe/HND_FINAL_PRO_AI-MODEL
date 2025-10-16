from app.config.firebase_connection import FirebaseConnector
from firebase_admin import firestore

connector = FirebaseConnector()
__db = connector.get_connection()

def save_structured_questions(questions: list, subject: str, source_file: str):
    """
    Save structured questions to Firebase
    """
    try:
        print(f"🔥 Starting Firebase save for {len(questions)} questions to subject: {subject}")

        batch = __db.batch()

        # First, ensure subject document exists
        subject_ref = __db.collection("subjects").document(subject)
        batch.set(subject_ref, {
            "name": subject.replace("-", " ").title(),
            "description": f"Past papers and questions for {subject}",
            "total_questions": firestore.Increment(len(questions)),
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)

        for i, question_data in enumerate(questions):
            # Create question document
            question_ref = __db.collection("questions").document()

            # Add subject reference and metadata
            question_data["subject"] = subject
            question_data["source_file"] = source_file
            question_data["created_at"] = firestore.SERVER_TIMESTAMP

            #Add source tracking (extracted vs AI-generated)
            if "source" not in question_data:
                question_data["source"] = "extracted" #Default for existing questions

            #Ensure correct_answer feild exists (can be empty)
            if "correct_answer" not in question_data:
                question_data["correct_answer"] = ""

            batch.set(question_ref, question_data)
            source_type = question_data.get("source", "extracted")
            print(f"  📝 Question {i+1} ({source_type}): {question_data['text'][:50]}...")

        # Commit batch
        batch.commit()
        result_msg = f"Successfully saved {len(questions)} structured questions to subject '{subject}'"
        print(f"✅ {result_msg}")
        return result_msg

    except Exception as error:
        error_msg = f"Saving failed: {str(error)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return error_msg

def get_questions_by_subject(subject: str, limit: int = 50):
    """
    Get questions for a specific subject
    """
    try:
        questions_ref = __db.collection("questions")
        query = questions_ref.where("subject", "==", subject).limit(limit)
        docs = query.stream()

        questions = []
        for doc in docs:
            question_data = doc.to_dict()
            question_data["id"] = doc.id
            questions.append(question_data)

        return questions
    except Exception as error:
        print(f"Error fetching questions: {error}")
        return []
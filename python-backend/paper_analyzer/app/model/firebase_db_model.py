from google.cloud.firestore_v1 import FieldFilter

from app.config.firebase_connection import FirebaseConnector
from firebase_admin import firestore
import datetime

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


#return question and there sources for specific subject
def get_questions_and_sources(subject):
    try:
        docs = (__db.collection("questions")
                .select(["text", "source_file", "source"])
                .where("subject", "==", subject)
                .stream())

        results = []

        for doc in docs:
            data = doc.to_dict()
            text = data.get("text", "No text")
            source_file = data.get("source_file", "Unknown source")
            source = data.get("source")

            results.append((text, source_file))

            # debug
            if source == "extracted" or not source:  # None or ""
                print(f"[{source_file}] {text} (source: {source})")

        return results

    except Exception as error :
        print(f"Error fetching questions: {error}")
        return []

#return all available questions with there source and subject
def get_all_questions_and_sources():
    try:
        qurry = ((__db.collection("questions")
                 .select(["text","source_file","source","subject"]))
                 .stream())

        results = []

        for doc in qurry:
            data = doc.to_dict()
            text = data.get("text", "No text")
            source_file = data.get("source_file", "Unknown source")
            source = data.get("source")
            subject = data.get("subject")

            results.append((text, source_file,subject))

            # debug
            if source == "extracted" or not source:  # None or ""
                print(f"{subject}-[{source_file}] {text} (source: {source})")

        return results

    except Exception as error:
        print(f"Error fetching questions: {error}")
        return []

def save_mock_test_feed_back(data: dict, user: str):
    """
    Save mock test feedback to Firebase Firestore

    Args:
        data (dict): The feedback data from Gemini
        user (str): The user ID to associate with this feedback
    """
    try:

        # Add user ID and timestamp to the data
        enhanced_data = {
            **data,  # Spread the original data
            "user_id": user,
            "timestamp": datetime.datetime.now(),
            "created_at": firestore.SERVER_TIMESTAMP
        }

        # Reference to the mock_test_feedback collection
        collection_ref = __db.collection('mock_test_feedback')

        # Add the document to Firestore
        doc_ref = collection_ref.add(enhanced_data)

        print(f"Successfully saved mock test feedback for user {user}")
        print(f"Document ID: {doc_ref[1].id}")

        return "Feedback saved successfully"


    except Exception as e:
        print(f"Error saving mock test feedback: {e}")
        return "Failed to save feedback"

def get_all_feedback_for_userid(userid):
    try:
        if(userid is not None):
            qurry = (__db.collection("mock_test_feedback")
                     .where(filter=FieldFilter("user_id","==",userid))
                     .stream())
        else:
            qurry = (__db.collection("mock_test_feedback")
                     .stream())

        feed_back_list =[]

        for doc in qurry:
            data = doc.to_dict()
            data["id"] =doc.id
            feed_back_list.append(data)

        print(feed_back_list)
        return feed_back_list

    except Exception as error:
        print(f"Error{error}")
        return f"Error getting feedback {error}"

def get_all_feedback_by_subject(userid,subject):

    try:

        if(userid is not None):
            query = (__db.collection("mock_test_feedback")
                      .where(filter=FieldFilter("user_id","==",userid))
                     .where(filter=FieldFilter("subject", "==",subject))
                     .stream())
        else:
            query = (__db.collection("mock_test_feedback")
                     .where(filter=FieldFilter("subject", "==", subject))
                     .stream())


        feed_back_list =[]

        for doc in query:
            data = doc.to_dict()
            data["id"] =doc.id
            feed_back_list.append(data)

        print(feed_back_list)
        return feed_back_list

    except Exception as error:
        print(f"Error{error}")
        return f"Error getting feedback {error}"

def get_all_subjects_on_feedbacks(userid):
    try:
        if(userid is not None):
            qurry = (__db.collection("mock_test_feedback")
                     .where("user_id", "==", userid)
                     .select(["subject"])
                     .stream())
        else:
            qurry = (__db.collection("mock_test_feedback")
                     .select(["subject"])
                     .stream())


        subject_set = set()

        for doc in qurry:
            data = doc.to_dict()
            print("Document data:", data)  # debug
            subject_set.add(data.get("subject"))

        subject_list = list(subject_set)
        print(subject_list)
        return subject_list

    except Exception as error:
        print(f"Error{error}")
        return f"Error getting feedback {error}"


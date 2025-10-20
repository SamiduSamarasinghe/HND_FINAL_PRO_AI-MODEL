from app.model.firebase_db_model import get_all_feedback_for_userid,get_all_feedback_by_subject
from app.model.firebase_db_model import get_all_subjects_on_feedbacks

def get_all_feedback_for_user(userid):
    try:
        return get_all_feedback_for_userid(userid)
    except Exception as error:
        print(f"Error{error}")
        return f"Error{error}"

def get_all_feedback_subect_wise(userid,subject):
    try:
        return get_all_feedback_by_subject(userid,subject)
    except Exception as error:
        print(f"Error{error}")
        return f"Error{error}"

def get_all_subjects_in_feedbacks(userid):
    try:
        return get_all_subjects_on_feedbacks(userid)
    except Exception as error:
        print(f"Error{error}")
        return f"Error{error}"
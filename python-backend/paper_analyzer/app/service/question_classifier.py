import re
from typing import List, Dict
from app.model.test_models import QuestionType

def classify_and_structure_questions(cleaned_questions: List[str]) -> List[Dict]:
    """
    Classify questions and structure them for storage
    """
    structured_questions = []

    for question_text in cleaned_questions:
        if not is_valid_question(question_text):
            continue

        # Classify question type
        question_type = classify_question_type(question_text)

        # Generate options for MCQ
        options = generate_mcq_options(question_text) if question_type == QuestionType.MCQ else None

        structured_questions.append({
            "text": clean_question_text(question_text),
            "type": question_type.value,
            "options": options,
            "correct_answer": generate_correct_answer(question_text, question_type),
            "source": "extracted"
        })

    return structured_questions

def generate_correct_answer(question_text: str, question_type: QuestionType) -> str:
    """
    Generate placeholder correct answers that can be filled later
    """
    if question_type == QuestionType.MCQ:
        return "A" #Default correct answer for MCQ
    elif question_type == QuestionType.SHORT_ANSWER:
        return "Sample answer based on question context"
    elif question_type == QuestionType.ESSAY:
        return  "Essay grading rubric and key points"
    return ""

def classify_question_type(question_text: str) -> QuestionType:
    """
    Improved question type classification
    """
    text_lower = question_text.lower()

    # MCQ detection - looks for options pattern
    if re.search(r'\([a-d]\)|\([A-D]\)|option\s+[a-d]|choice\s+[a-d]', text_lower):
        return QuestionType.MCQ

    # Essay detection - explanation/discussion questions
    essay_keywords = ['explain', 'describe', 'discuss', 'compare', 'contrast', 'analyze', 'evaluate']
    if any(keyword in text_lower for keyword in essay_keywords):
        return QuestionType.ESSAY

    # Short answer - calculation/specific answer questions
    short_answer_keywords = ['calculate', 'compute', 'find', 'determine', 'what is', 'how many']
    if any(keyword in text_lower for keyword in short_answer_keywords):
        return QuestionType.SHORT_ANSWER

    # Default to SHORT_ANSWER
    return QuestionType.SHORT_ANSWER

def generate_mcq_options(question_text: str) -> List[str]:
    """
    Generate meaningful MCQ options (placeholder - can be enhanced with AI)
    """
    # Simple pattern-based option generation
    # In future, use AI to generate plausible distractors
    return [
        "Option A - First choice",
        "Option B - Second choice",
        "Option C - Third choice",
        "Option D - Fourth choice"
    ]


def is_valid_question(text: str) -> bool:
    """
    Validate if text is a proper question
    """
    if not text or len(text.strip()) < 15:
        return False

    # Should contain at least some question words
    question_indicators = ['what', 'how', 'why', 'calculate', 'find', 'explain', 'describe']
    if not any(indicator in text.lower() for indicator in question_indicators):
        return False

    return True

def clean_question_text(text: str) -> str:
    """
    Clean question text - remove numbering, extra spaces
    """
    # Remove leading numbers like "1.", "a)", etc.
    cleaned = re.sub(r'^\s*(\d+[\.\)]|\w[\)\.])\s*', '', text.strip())
    # Collapse multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()
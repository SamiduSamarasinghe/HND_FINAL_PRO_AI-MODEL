import re
import random
from typing import List, Dict
from app.model.test_models import QuestionType
from app.service.ai_model import model

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
        options = None
        correct_answer = None

        if question_type == QuestionType.MCQ:
            options, correct_answer = generate_meaningful_mcq_options(question_text)
        else:
            correct_answer = generate_correct_answer(question_text, question_type)

        structured_questions.append({
            "text": clean_question_text(question_text),
            "type": question_type.value,
            "options": options,
            "correct_answer": correct_answer,
            "source": "extracted"
        })

    return structured_questions

def generate_meaningful_mcq_options(question_text: str) -> tuple[List[str], str]:
    """
    Generate 4 MCQ options with one correct answer placed randomly
    """
    try:
        # Extract the core concept from the question
        core_concept = extract_mcq_core_concept(question_text)

        if core_concept:
            # Use AI to generate 1 correct + 3 plausible wrong answers
            correct_answer, wrong_answers = generate_dynamic_mcq_options(core_concept, question_text)

            if correct_answer and len(wrong_answers) >= 3:
                #Combine all options
                all_options = [correct_answer] + wrong_answers[:3]

                #Shuffle the options randomly
                random.shuffle(all_options)

                #Find the position of correct answer after shuffling
                correct_position = all_options.index(correct_answer)
                correct_letter = chr(65 + correct_position) #A,B,C, or D

                return all_options, correct_letter

    except Exception as e:
        print(f"AI MCQ generation failed, using fallback: {e}")

    #Fallback with random placement
    return generate_fallback_mcq_options()

def extract_mcq_core_concept(question_text: str) -> str:
    """
    Extract the core concept being tested in the MCQ
    """
    # Remove common MCQ patterns
    text = re.sub(r'\([a-d]\)|\([A-D]\)', '', question_text)
    text = re.sub(r'option\s+[a-d]|choice\s+[a-d]', '', text, flags=re.IGNORECASE)

    # Extract key phrases
    patterns = [
        r'what is (.+?)\?',
        r'which of (.+?)\?',
        r'what are (.+?)\?',
        r'identify (.+?)\?',
        r'select (.+?)\?'
    ]

    for pattern in patterns:
        match = re.search(pattern, question_text.lower())
        if match:
            return match.group(1).strip()

    return question_text[:100] #Return first 100 chars as fallback

def generate_dynamic_mcq_options(question_text: str) -> tuple[str, List[str]]:
    """
    Use AI to dynamically generate 1 correct answer and 3 plausible wrong answers
    for ANY subject
    """
    try:
        #Extract key terms from the question for context
        key_terms = extract_key_terms(question_text)

        #Use AI model to generate options
        prompt = f"""
        Based on this question: "{question_text}
        
        Generate:
        1. One Correct answer (concise and accurate)
        2. Three PLAUSIBLE but INCORRECT answers (related to the topic but wrong)
        
        Format:
        Correct: [correct answer]
        Wrong1: [first wrong answer]
        Wrong2: [second wrong answer]
        Wrong3: [third wrong answer]
        """

        #Use existing AI model
        response = model(prompt) #Actual AI call

        #Parse the AI response(need to adapt this based on AI's output format)
        correct, wrong_answers = parse_ai_mcq_response(response)
        return correct, wrong_answers

    except Exception as e:
        print(f"Dynamic MCQ generation error: {e}")
        #Fallback to pattern based generation
        return generate_pattern_based_options(question_text)

def extract_key_terms(question_text: str) -> List[str]:
    """
    Extract key terms from the question for context
    """
    #Remove common question words
    stop_words = {'what', 'is', 'are', 'the', 'of', 'in', 'and', 'or', 'for', 'to', 'with'}

    #Extract meaningful words
    words = re.findall(r'\b[a-zA-Z]{4,}\b', question_text.lower())
    key_terms = [word for word in words if word not in stop_words]

    return key_terms[:5] #Return top 5 key terms

def generate_pattern_based_options(question_text: str) -> tuple[str, List[str]]:
    """
    Generate options based on question patterns (fallback when AI fails)
    """
    text_lower = question_text.lower()

    #Pattern 1: definition questions(what is x)
    if re.match(r'what is .+\?', text_lower):
        concept = re.search(r'what is (.+?)\?', text_lower)
        if concept:
            term = concept.group(1)
            correct = f"Definition or explanation of {term}"
            wrong_answers = [
                f"Common misconception about {term}",
                f"Related but different concept from {term}",
                f"Opposite meaning of {term}",
                f"Unrelated technical term"
            ]
            return correct, wrong_answers

    #Pattern 2: advantage/disadvantage questions
    elif any(word in text_lower for word in ['advantage', 'benefit', 'strength']):
        correct = "Key advantage or benefit"
        wrong_answers = [
            "Common disadvantage or limitation",
            "Unrelated feature",
            "Implementation difficulty",
            "Historical context instead of advantage"
        ]
        return correct, wrong_answers

    #Pattern 3: Process/Step questions
    elif any(word in text_lower for word in ['process', 'step', 'phase', 'stage']):
        correct = "Key step or phase in the process"
        wrong_answers = [
            "Incorrect sequence or order",
            "Prerequisite instead of step",
            "Outcome instead of process step",
            "Unrelated activity"
        ]
        return correct, wrong_answers

    # Default pattern for any question
    correct = "Accurate answer based on the question context"
    wrong_answers = [
        "Plausible but incorrect alternative",
        "Common misunderstanding related to the topic",
        "Overly simplified or incomplete answer",
        "Technically related but fundamentally wrong concept"
    ]

    return correct, wrong_answers

def parse_ai_mcq_response(response: str) -> tuple[str, List[str]]:
    """
    Parse the AI response to extract correct and wrong answers
    Adapt this based on your AI model's output format
    """
    # This is a template - you need to adapt it to your AI's actual response format
    lines = response.strip().split('\n')
    correct = ""
    wrong_answers = []

    for line in lines:
        line_lower = line.lower()
        if line_lower.startswith('correct:'):
            correct = line.split(':', 1)[1].strip()
        elif line_lower.startswith('wrong1:'):
            wrong_answers.append(line.split(':', 1)[1].strip())
        elif line_lower.startswith('wrong2:'):
            wrong_answers.append(line.split(':', 1)[1].strip())
        elif line_lower.startswith('wrong3:'):
            wrong_answers.append(line.split(':', 1)[1].strip())

    # Fallback if parsing fails
    if not correct:
        correct = "Correct answer based on AI analysis"
    if len(wrong_answers) < 3:
        wrong_answers.append(f"Plausible distractor {len(wrong_answers) + 1}")

    return correct, wrong_answers[:3]

def generate_fallback_mcq_options() -> tuple[List[str], str]:
    """
    Final fallback MCQ options with random correct answer placement
    """
    options = [
        "Correct answer based on the question",
        "Plausible but incorrect alternative",
        "Common misconception related to the topic",
        "Unrelated but technical-sounding option"
    ]

    # Shuffle and determine correct position
    random.shuffle(options)
    correct_position = options.index("Correct answer based on the question")
    correct_letter = chr(65 + correct_position)

    return options, correct_letter

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
    Enhanced question text cleaning
    """
    # Remove leading numbers and markers
    cleaned = re.sub(r'^\s*(\d+[\.\)]|\w[\)\.]|[Qq]\.?\d*)\s*', '', text.strip())

    # Remove common prefixes
    prefixes = [
        r'^question\s*\d*\s*[:.-]?\s*',
        r'^part\s+[a-z]\s*',
        r'^section\s+[a-z]\s*',
    ]

    for prefix in prefixes:
        cleaned = re.sub(prefix, '', cleaned, flags=re.IGNORECASE)

    # Collapse multiple spaces and clean up
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = cleaned.strip()

    # Ensure it ends with proper punctuation
    if not cleaned.endswith(('?', '.', ':')):
        cleaned += '.'

    return cleaned

def remove_duplicate_questions(questions: List[str]) -> List[str]:
    """
    Remove duplicate or very similar questions
    """
    unique_questions = []
    seen_content = set()

    for question in questions:
        # Create a signature for comparison (first 50 chars + length)
        signature = f"{len(question)}:{question[:50].lower()}"

        if signature not in seen_content:
            seen_content.add(signature)
            unique_questions.append(question)

    return unique_questions
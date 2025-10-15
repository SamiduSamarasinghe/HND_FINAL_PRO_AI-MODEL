import re
from typing import List, Dict
from app.config.firebase_connection import FirebaseConnector
from app.model.test_models import Question, QuestionType, Difficulty

class QuestionExtractionService:
    def __init__(self):
        print("Initializing QuestionExtractionService...")

        try:
            connector = FirebaseConnector()
            self.db = connector.get_connection()
            print("QuestionExtractionService initialized successfully")

        except Exception as e:
            print(f"Error initializing QuestionExtractionService: {e}")
            raise


    def extract_question_from_firebase(self, subject: str) -> List[Question]:
        """
        Extract questions from Firebase for a given subject
        """
        try:
            print(f"Extracting questions for subject: {subject}")

            #fetch all papers for the subject
            papers_ref = self.db.collection(subject)
            docs = papers_ref.stream()

            all_questions = []
            doc_count = 0

            for doc in docs:
                doc_count += 1
                data = doc.to_dict()
                if "content" in data:
                    content = data["content"]
                    questions = self._parse_questions_from_content(content)
                    all_questions.extend(questions)
                    print(f"Document {doc_count}: Found {len(questions)} questions")

            print(f"Extracted {len(all_questions)} questions from {doc_count} documents in {subject}")
            return  all_questions

        except Exception as e:
            print(f"Error extracting question: {str(e)}")
            return []

    def _parse_questions_from_content(self, content: str) -> List[Question]:
        """
        Parse questions from the Firebase content format
        """
        questions = []

        #Extract from "cleaned questions" section
        start_marker = "==========Cleaned Questions =========="
        end_marker = "==========Core Logics ============="

        start_pos = content.find(start_marker)
        if start_pos == -1:
            return questions

        start_pos += len(start_marker)
        end_pos = content.find(end_marker, start_pos)

        if end_pos == -1:
            questions_text = content[start_pos:]
        else:
            questions_text = content[start_pos:end_pos]

        #split into individuals questions
        question_lines = questions_text.strip().split('\n')

        for line in question_lines:
            line = line.strip()
            if self._is_valid_question(line):
                question = self._classify_question(line)
                if question:
                    questions.append(question)

        return questions

    def _is_valid_question(self, text: str) -> bool:
        """
        Validate if text is a proper question
        """
        if not text or len(text) < 10:
            return False

        #skkip lines that are just numbers or very short
        if len(text.split()) < 3:
            return False

        #Skip common non-questions patterns
        non_question_patterns = [
            r'^[a-z]\s*$',
            r'^\d+\s*$',
            r'^page\s*\d+',
            r'^---',
        ]

        for pattern in non_question_patterns:
            if re.match(pattern, text.lower()):
                return False

        return True
    def _classify_question(self, text: str) -> Question:
        """
        Classify question type and difficulty
        """
        text_lower = text.lower()

        #determine question type
        if any(keyword in text_lower for keyword in ['explain', 'describe', 'discuss', 'essay']):
            question_type =QuestionType.ESSAY
            points = 10

        elif any(keyword in text_lower for keyword in ['calculate', 'find', 'determine', 'what is']):
            question_type = QuestionType.SHORT_ANSWER
            points = 5

        else:
             question_type = QuestionType.MCQ
             points = 2

        #determine difficulty
        word_count = len(text.split())
        if word_count > 20 or any(complex_word in text_lower for complex_word in
                                 ['probability', 'deviation', 'correlation', 'calculate']):
            difficulty = Difficulty.HARD
        elif word_count > 12:
             difficulty = Difficulty.MEDIUM
        else:
            difficulty = Difficulty.EASY

        #create MCQ questions if needed
        options = None
        if question_type == QuestionType.MCQ:
            options = ["Option A", "Option B", "Option C", "Option D"]

        return Question(
            text=text,
            type=question_type,
            points=points,
            difficulty=difficulty,
            options=options
        )
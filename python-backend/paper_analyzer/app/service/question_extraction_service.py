import re
from typing import List, Dict
from app.config.firebase_connection import FirebaseConnector
from app.model.test_models import Question, QuestionType

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
        Extract structured questions from Firebase
        """
        try:
            questions_ref = self.db.collection("questions")
            query = questions_ref.where("subject", "==", subject)
            docs = query.stream()

            all_questions = []

            print(f"Looking for questions in subject: {subject}")

            for doc in docs:
                data = doc.to_dict()

                #Debug: check subject and content
                doc_subject = data.get("subject", "")
                question_text = data.get("text", "")

                #Skip if subject doesn't match
                if doc_subject.lower() != subject.lower():
                    print(f"Skipping question - subject mismatch: {doc_subject} != {subject}")
                    continue

                # Convert to Question model
                question = Question(
                    text=data["text"],
                    type=QuestionType(data.get("type", "MCQ")),
                    points=self._assign_points(data.get("type", "MCQ")),
                    options=data.get("options"),
                    correct_answer=data.get("correct_answer", "")
                )

                all_questions.append(question)

            print(f"Extracted {len(all_questions)} structured questions from {subject}")
            return all_questions

        except Exception as e:
            print(f"Error extracting questions: {str(e)}")
            return []

    def _assign_points(self, question_type: str) -> int:
        """
        Assign points based on question type only (no difficulty)
        """
        points_map = {
            "MCQ": 2,
            "SHORT_ANSWER": 5,
            "ESSAY": 10
        }
        return points_map.get(question_type, 2)

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

        #create MCQ questions if needed
        options = None
        if question_type == QuestionType.MCQ:
            options = ["Option A", "Option B", "Option C", "Option D"]

        return Question(
            text=text,
            type=question_type,
            points=points,
            options=options
        )
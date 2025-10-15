import random
from typing import List, Dict
from datetime import datetime
from app.model.test_models import GeneratedTest, TestGenerationRequest, Question, Difficulty, QuestionType
from app.service.question_extraction_service import  QuestionExtractionService

class TestGenerationService:
    def __init__(self):
        self.question_extractor = QuestionExtractionService()

    def generate_mock_test(self, request: TestGenerationRequest, user_id: str) -> GeneratedTest:
        """
        Generate a mock test based on the request parameters
        """
        try:
            print("Starting test generation...")

            #Extract all questions for the subject
            all_questions = self.question_extractor.extract_question_from_firebase(request.subject)
            print(f"Found {len(all_questions)} total questions")

            if not all_questions:
                raise ValueError(f"No questions found for subject: {request.subject}")

            #Filter questions by requested types and difficulty
            filtered_questions = self._filter_questions(
                all_questions,
                request.question_types,
                request.difficulty
            )
            print(f"Filtered to {len(filtered_questions)} questions matching criteria")

            if not filtered_questions:
                raise ValueError("No questions match the specified criteria")

            #Select random questions
            selected_questions = self._select_questions(
                filtered_questions,
                request.question_count
            )
            print(f"Selected {len(selected_questions)} questions for the test")

            #Calculate totals
            total_points =  sum(q.points for q in selected_questions)

            #Create test
            test = GeneratedTest(
                id=self._generate_test_id(),
                title=f"{request.subject} {request.difficulty.value} Mock Test",
                subject=request.subject,
                questions=selected_questions,
                total_questions=len(selected_questions),
                total_points=total_points,
                difficulty=request.difficulty,
                created_at=datetime.now(),
                created_by=user_id,
                class_id=request.class_id
            )
            print("Test generation completed successfully")
            return test

        except Exception as e:
            print(f"Error in generate_mock_test: {str(e)}")
            raise

    def _filter_questions(self, questions: List[Question],
                          question_types: Dict[QuestionType, bool],
                          difficulty: Difficulty) -> List[Question]:
        """
        Filter question by type and difficulty
        """
        filtered = []

        for question in questions:
            #Check if question type is enabled
            if not question_types.get(question.type, False):
                continue

            #Check if difficulty match
            if question.difficulty == difficulty:
                filtered.append(question)

        return filtered

    def _select_questions(self, questions: List[Question], count: int) -> List[Question]:
        """
        Select random questions, with fallback logic if not enough available
        """
        if len(questions) <= count:
            return questions

        # Random selection
        return random.sample(questions, count)

    def _generate_test_id(self) -> str:
        """
        Generate a unique test ID
        """
        import uuid
        return f"test_{uuid.uuid4().hex[:8]}"

    def get_available_subjects(self) -> List[str]:
        """
        Get list of available subjects from Firebase
        """
        # For now, return hardcoded subjects based on your Firebase structure
        # You can enhance this to dynamically detect subjects
        return ["statistics-papers"]


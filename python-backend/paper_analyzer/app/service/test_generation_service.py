import random
from typing import List, Dict
from datetime import datetime
from app.model.test_models import GeneratedTest, TestGenerationRequest, Question, QuestionType
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

            #Seperate AI-Generated questions from extracted ones
            ai_questions = [q for q in all_questions if getattr(q, 'source', None) == 'ai_generated']
            extracted_questions = [q for q in all_questions if getattr(q, 'source', None) != 'ai_generated']

            print(f"AI-generated questions: {len(ai_questions)}")
            print(f"Extracted questions: {len(extracted_questions)}")

            #Filter questions by requested types
            filtered_ai_questions = self._filter_questions(ai_questions, request.question_types)
            filtered_extracted_questions = self._filter_questions(extracted_questions, request.question_types)

            print(f"Filtered AI questions: {len(filtered_ai_questions)}")
            print(f"Filtered extracted questions: {len(filtered_extracted_questions)}")

            #Prefer AI-generated questions to avoid repitition
            if len(filtered_ai_questions) >= request.question_count:
                #Use onl AI-generated questions if we have enough
                selected_questions = self._select_questions(filtered_ai_questions, request.question_count)
                print("Using only AI-generated questions")

                #Mix AI and extracted questions
                ai_count = min(len(filtered_ai_questions), request.question_count)
                extracted_count = request.question_count - ai_count

                ai_selected = self._select_questions(filtered_ai_questions, ai_count)
                extracted_selected = self._select_questions(filtered_extracted_questions, extracted_count)

                selected_questions = ai_selected + extracted_selected
                print(f"Mixed selection: {len(ai_selected)} AI + {len(extracted_selected)} extracted")
                print(f"Selected {len(selected_questions)} questions for the test")

                #Calculate totals
                total_points = sum(q.points for q in selected_questions)

                #Create test
                test = GeneratedTest(
                    id=self._generate_test_id(),
                    title=f"{request.subject} Mock Test",
                    subject=request.subject,
                    questions=selected_questions,
                    total_points=total_points,
                    created_at=datetime.now(),
                    created_by=user_id,
                    class_id=request.class_id
                )
                print("Test generation completed successfully")
                return test
        except Exception as e:
            print(f"Error in generate_mock_test: {str(e)}")
            raise


            if not filtered_questions:
                raise ValueError("No questions match the specified criteria")


    def _filter_questions(self, questions: List[Question], question_types: Dict[QuestionType, bool]) -> List[Question]:
        """
        Filter questions only by type
        """
        filtered = []

        #Convert enabled question types to string values for comparison
        enabled_types = []
        for q_type, enabled in question_types.items():
            if enabled:
                # Convert enum to string value for comparison
                enabled_types.append(q_type.value)

        print(f"Looking for questions of types: {enabled_types}")

        for question in questions:
            #Compare string values instead of enum objects
            if question.type.value in enabled_types:  # Use .value to get the string
                filtered.append(question)
                print(f"Included question: {question.type.value} - {question.text[:50]}...")

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
        return ["statistics-papers"]


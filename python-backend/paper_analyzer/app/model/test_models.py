from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MCQ = "MCQ"
    SHORT_ANSWER = "Short Answer"
    ESSAY = "Essay"


class Question(BaseModel):
    text: str
    type: QuestionType
    points: int
    options: Optional[List[str]] = None  # For MCQ
    correct_answer: Optional[str] = None

class GeneratedTest(BaseModel):
    id: str
    title: str
    subject: str
    questions: List[Question]
    total_questions: int
    total_points: int
    created_at: datetime
    created_by: str  # user_id
    class_id: Optional[str] = None

class TestGenerationRequest(BaseModel):
    subject: str
    question_types: Dict[QuestionType, bool]
    question_count: int
    class_id: Optional[str] = None

class StructuredQuestion(BaseModel):
    text: str
    type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    topic: str
    subject: str
    source_file: str
    created_at: datetime

class Subject(BaseModel):
    name: str
    description: str
    total_questions: int
    last_updated: datetime
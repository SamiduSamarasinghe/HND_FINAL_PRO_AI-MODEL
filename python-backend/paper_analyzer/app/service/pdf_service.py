from fastapi import UploadFile
import fitz
from io import BytesIO
from app.model.firebase_db_model import save_structured_questions
from app.service.pdf_question_preparer import get_clean_questions
from app.service.question_classifier import classify_and_structure_questions
from app.service.question_generation_service import QuestionGenerationService  # ADD THIS

async def process_pdf(isPaper: bool, file: UploadFile, subject: str):
    try:
        if file is not None:
            print(f"📁 Processing PDF: {file.filename} for subject: {subject}")

            contents = await file.read()
            pdf_stream = BytesIO(contents)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")

            # Extract text from all pages
            all_pages_text = []
            for page_index, page in enumerate(doc):
                text = page.get_text()
                all_pages_text.append(text)
                print(f"📄 Page {page_index + 1}: {len(text)} characters")

            full_text = "\n--- Page Break ---\n".join(all_pages_text)
            print(f"📊 Total text extracted: {len(full_text)} characters")

            # Get cleaned questions (for past papers)
            cleaned_questions = get_clean_questions(full_text)
            print(f"❓ Found {len(cleaned_questions)} cleaned questions")

            # Initialize question generator
            question_generator = QuestionGenerationService()
            structured_questions = []
            new_questions = []

            if isPaper:
                # For past papers: classify existing questions
                if cleaned_questions:
                    structured_questions = classify_and_structure_questions(cleaned_questions)
                    print(f"Structured {len(structured_questions)} existing questions")

                # Always generate new questions to ensure we have content
                new_questions = question_generator.generate_questions_from_content(
                    content=full_text,
                    question_types=["MCQ", "Short Answer", "Essay"],
                    num_questions=8  # Reduced for stability
                )
                print(f"Generated {len(new_questions)} new AI questions")

                # Combine questions
                all_questions = structured_questions + new_questions
                print(f"Total questions: {len(all_questions)}")

            else:
                # For lecture notes: Generate questions from content only
                print("Processing as lecture notes - generating questions from content")

                # Try AI generation first
                new_questions = question_generator.generate_questions_from_lecture_notes(
                    content=full_text,
                    question_types=["MCQ", "Short Answer", "Essay"],
                    num_questions=6,  # Target more questions
                    subject=subject
                )

                # If AI fails, use fallback
                if not new_questions:
                    print("AI generation failed, using fallback questions")
                    new_questions = question_generator._generate_fallback_questions(
                        full_text, ["MCQ", "Short Answer", "Essay"], 6, subject
                    )

                print(f"Generated {len(new_questions)} questions from lecture notes")
                all_questions = new_questions

            # If no questions were generated, create fallback questions
            if not all_questions:
                print("⚠️ No questions generated, creating fallback questions")
                all_questions = question_generator._generate_fallback_questions(
                    full_text, ["MCQ", "Short Answer", "Essay"], 5, subject
                )
                print(f"🔄 Created {len(all_questions)} fallback questions")

            # Save questions to Firebase
            if all_questions:
                result = save_structured_questions(
                    questions=all_questions,
                    subject=subject,
                    source_file=file.filename
                )
                print(f"💾 Firebase save result: {result}")

                return {
                    "message": result,
                    "questions_processed": len(all_questions),
                    "existing_questions": len(structured_questions),
                    "ai_generated_questions": len(new_questions),
                    "subject": subject,
                    "note": "Questions generated using AI" if not structured_questions else "Mixed extracted and AI-generated questions"
                }
            else:
                return {
                    "message": "No questions could be generated from the document",
                    "questions_processed": 0,
                    "existing_questions": 0,
                    "ai_generated_questions": 0,
                    "subject": subject,
                    "note": "Please try a different document or check the content"
                }

        return "Reading failed"
    except Exception as error:
        print(f"❌ Processing failed: {str(error)}")
        import traceback
        traceback.print_exc()
        return f"Processing failed: {str(error)}"


async def read_pdf_file(file:UploadFile):
    if file is not None:

        contents = await file.read()
        pdf_stream = BytesIO(contents)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")

        # Extract text from all pages
        all_pages_text = []
        for page_index, page in enumerate(doc):
            text = page.get_text()
            all_pages_text.append(text)
            print(f" Page {page_index + 1}: {len(text)} characters")

        full_text = "\n--- Page Break ---\n".join(all_pages_text)
        print(f"Total text extracted: {len(full_text)} characters")

        # Get cleaned questions (for past papers)
        cleaned_questions = get_clean_questions(full_text)
        print(f" Found {len(cleaned_questions)} cleaned questions")

    return cleaned_questions
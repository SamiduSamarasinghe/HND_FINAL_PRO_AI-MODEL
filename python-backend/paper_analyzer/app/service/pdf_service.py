from fastapi import UploadFile
import fitz,re
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

                # Check if we have enough MCQs from extracted questions
                extracted_mcqs = [q for q in structured_questions if q.get('type') == 'MCQ']

                # Only generate new MCQs if we don't have enough from extraction
                if len(extracted_mcqs) < 4:  # Minimum threshold
                    new_questions = question_generator.generate_questions_from_content(
                        content=full_text,
                        question_types=["MCQ", "Short Answer", "Essay"],
                        num_questions=6  # Reduced for stability
                    )
                    print(f"Generated {len(new_questions)} new AI questions")
                else:
                    print("✅ Sufficient MCQs from extracted questions, skipping AI generation")
                    new_questions = []

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
                    num_questions=8,  # Target more questions
                    subject=subject
                )

                # If AI fails or produces incomplete questions, use fallback
                valid_mcqs = [q for q in new_questions if q.get('type') == 'MCQ' and
                              q.get('options') and len(q.get('options', [])) == 4]

                if len(valid_mcqs) < 2:  # Not enough good MCQs
                    print("⚠️ Insufficient valid MCQs generated, using enhanced fallback")
                    # Use fallback but ensure MCQs are complete
                    fallback_questions = question_generator._generate_fallback_questions(
                        full_text, ["MCQ", "Short Answer", "Essay"], 6, subject
                    )
                    # Ensure fallback MCQs are complete
                    for q in fallback_questions:
                        if q.get('type') == 'MCQ' and (not q.get('options') or len(q.get('options', [])) != 4):
                            q['options'] = [
                                f"Primary feature of {q.get('topic', 'the concept')}",
                                f"Common misconception about {q.get('topic', 'the concept')}",
                                f"Related but different concept",
                                f"Historical context of {q.get('topic', 'the concept')}"
                            ]
                    new_questions = fallback_questions

                print(f"Generated {len(new_questions)} questions from lecture notes")
                all_questions = new_questions

            #Final validation before saving
            valid_questions = []
            for q in all_questions:
                if q.get('type') == 'MCQ':
                    options = q.get('options', [])
                    if len(options) == 4 and all(opt and len(opt.strip()) > 1 for opt in options):
                        valid_questions.append(q)
                    else:
                        print(f"🔄 Filtered incomplete MCQ before saving: {q.get('text', '')[:50]}...")
                else:
                    valid_questions.append(q)

            print(f"📊 Final validated questions: {len(valid_questions)}/{len(all_questions)}")

            # If no questions were generated, create enhanced fallback questions
            if not valid_questions:
                print("⚠️ No valid questions generated, creating enhanced fallback questions")
                valid_questions = question_generator._generate_fallback_questions(
                    full_text, ["Short Answer", "Essay"], 4, subject  # Focus on reliable types
                )
                print(f"🔄 Created {len(valid_questions)} fallback questions")

            # Save questions to Firebase
            if valid_questions:
                result = save_structured_questions(
                    questions=valid_questions,
                    subject=subject,
                    source_file=file.filename
                )
                print(f"💾 Firebase save result: {result}")

                return {
                    "message": result,
                    "questions_processed": len(valid_questions),
                    "existing_questions": len(structured_questions),
                    "ai_generated_questions": len(new_questions),
                    "valid_questions": len(valid_questions),
                    "subject": subject,
                    "note": "Questions generated using AI" if not structured_questions else "Mixed extracted and AI-generated questions"
                }
            else:
                return {
                    "message": "No valid questions could be generated from the document",
                    "questions_processed": 0,
                    "existing_questions": 0,
                    "ai_generated_questions": 0,
                    "valid_questions": 0,
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

async def read_mock_test_papers(file:UploadFile):
    if file is not None:

        contents = await file.read()
        pdf_stream = BytesIO(contents)
        doc = fitz.open(stream=pdf_stream,filetype="pdf")

        all_pages = []
        for page_index, page in enumerate(doc):
            text = page.get_text()
            all_pages.append(text)
            print(f" Page {page_index + 1}: {len(text)} characters")

        full_text = "\n--- Page Break ---\n".join(all_pages)
        print(f"Total text extracted: {len(full_text)} characters")
        print(full_text)
        print("\n\nCleaned-Q&A Block\n")
        q_and_a_block = clean_mock_test_paper(full_text)

        print(q_and_a_block)
        return q_and_a_block


def clean_mock_test_paper(contents):

    cleaned_pages = contents.split("\n--- Page Break ---\n")
    questions_and_answers = []
    paper_subject = None

    # patterns
    subject_pattern = re.compile(
        r"Subject:\s*([^|]+)"
    )

    question_answer_pattern = re.compile(
        r"(Question\s*\d+\s*:.*?Points\s*:\s*\d+(?:.*?Your Answer:.*?(?=Question\s*\d+:|$)))",
        re.DOTALL
    )

    page_break_pattern = re.compile(
        r'-{2,}\s*Page\s*Break\s*-{2,}|^\s*\d+\s*\|\s*P\s*a\s*g\s*e\s*$',
        re.IGNORECASE | re.MULTILINE
    )

    # Loop through each page
    for i, page in enumerate(cleaned_pages):
        page = page_break_pattern.sub('', page).strip()

        # Extract subject only once (from the first page)
        if paper_subject is None:
            subject_match = subject_pattern.search(page)
            if subject_match:
                paper_subject = subject_match.group(1).strip()


        matches = question_answer_pattern.findall(page)
        for match in matches:
            questions_and_answers.append(match.strip())

    return {
        "subject": paper_subject,
        "questions": questions_and_answers
    }


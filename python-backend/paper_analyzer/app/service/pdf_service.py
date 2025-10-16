from fastapi import UploadFile
<<<<<<< HEAD
from app.model.firebase_db_model import saveToFirebase
from app.service.pdf_question_preparer import get_clean_questions
from app.service.ai_model import extract_core_logic



async def process_pdf(file: UploadFile,save:bool):
=======
import fitz
from io import BytesIO
from app.model.firebase_db_model import save_structured_questions
from app.service.pdf_question_preparer import get_clean_questions
from app.service.question_classifier import classify_and_structure_questions
>>>>>>> main

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

            # Get cleaned questions
            cleaned_questions = get_clean_questions(full_text)
<<<<<<< HEAD
            core_logices = extract_core_logic(cleaned_questions)

            combined_content = ("==========Cleaned Questions ==========\n"
                                +"\n".join(cleaned_questions)
                                +"==========Core Logics =============\n"
                                +"\n".join(core_logices))


            # Join all pages' text as one string'
            full_text = "\n--- Page Break ---\n".join(all_pages_text)

            #print(full_text)  # see extracted text
            
            if(save is True):
                return {saveToFirebase(combined_content)}
            else:
                return combined_content

=======
            print(f"❓ Found {len(cleaned_questions)} cleaned questions")

            if isPaper:
                # Classify and structure questions
                structured_questions = classify_and_structure_questions(cleaned_questions)
                print(f"🏷️  Structured {len(structured_questions)} questions")

                # Debug: Print first few structured questions
                for i, q in enumerate(structured_questions[:3]):
                    print(f"  Question {i+1}: {q['text'][:100]}... (Type: {q['type']})")

                # Save structured questions to Firebase
                result = save_structured_questions(
                    questions=structured_questions,
                    subject=subject,
                    source_file=file.filename
                )
                print(f"💾 Firebase save result: {result}")

                return {
                    "message": result,
                    "questions_processed": len(structured_questions),
                    "subject": subject
                }

            return "Read successful. New Notes added to database"
>>>>>>> main

        return "Reading failed"
    except Exception as error:
<<<<<<< HEAD
        return f"Reading Failed: {str(error)}"

    
=======
        print(f"❌ Processing failed: {str(error)}")
        import traceback
        traceback.print_exc()
        return f"Processing failed: {str(error)}"
>>>>>>> main

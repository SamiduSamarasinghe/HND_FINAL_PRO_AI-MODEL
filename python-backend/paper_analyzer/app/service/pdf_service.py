import fitz  # PyMuPDF
import re
from io import BytesIO
from fastapi import UploadFile
from app.model.firebase_db_model import saveToFirebase


from app.service.pdf_question_preparer import get_clean_questions
from app.service.ai_model import extractCoreLogic


async def process_pdf(isPaper: bool, file: UploadFile):

    try:
        if file is not None:
            contents = await file.read()
            pdf_stream = BytesIO(contents)

            # Open the PDF 
            doc = fitz.open(stream=pdf_stream, filetype="pdf")

            # Collect text from all pages
            all_pages_text = []
            for page_index,page in enumerate(doc):
                text = page.get_text()
                all_pages_text.append(text)

            full_text = "\n--- Page Break ---\n".join(all_pages_text)

            cleaned_questions = get_clean_questions(full_text)
            core_logices = extractCoreLogic(cleaned_questions)

            combined_content = ("==========Cleaned Questions ==========\n"
                                +"\n".join(cleaned_questions)
                                +"==========Core Logics =============\n"
                                +"\n".join(core_logices))


            # Join all pages' text as one string'
            full_text = "\n--- Page Break ---\n".join(all_pages_text)

            #print(full_text)  # see extracted text

            if isPaper:
                return {saveToFirebase(combined_content)}

           # else:
                return "Read successful. New Notes added to DataBase"

        return "Reading failed"

    except Exception as error:
        return f"Reading Failed: {str(error)}"
    
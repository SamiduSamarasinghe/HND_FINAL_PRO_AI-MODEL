import fitz  # PyMuPDF
import re
from io import BytesIO
from fastapi import UploadFile
from app.model.firebase_db_model import saveToFirebase


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

                if(page_index == 0):
                    get_paper_name(text)
                    

            # Join all pages' text as one string'
            full_text = "\n--- Page Break ---\n".join(all_pages_text)

            #print(full_text)  # see extracted text

            if isPaper:
               # return {saveToFirebase(all_pages_text)}

               return ""
            else:
                return "Read successful. New Notes added to DataBase"

        return "Reading failed"

    except Exception as error:
        return f"Reading Failed: {str(error)}"
    


def get_paper_name(first_page_text: str):

    cleaned_text = " ".join(first_page_text.split())
    match = re.search(r'([A-Za-z& ]+)\s+(\d{4})', cleaned_text)
    if match:
        print(f"{match.group(1).strip()} {match.group(2)} Paper")
    else:
        # Fallback: first 6 words
        print(" ".join(cleaned_text.split()[:20]))
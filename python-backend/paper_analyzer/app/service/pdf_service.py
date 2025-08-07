import fitz  # PyMuPDF
from io import BytesIO
from fastapi import UploadFile

async def process_pdf(isPaper: bool,file: UploadFile):

    try:
        if file is not None:

            contents = await file.read()
            pdf_stream = BytesIO(contents)

            # Open the PDF 
            doc = fitz.open(stream=pdf_stream, filetype="pdf")

            for page in doc:
                text = page.get_text()
                print(text)

            if(isPaper):
                   return "Read successful New Paper added to DataBase"
            else:
                return "Read successful New Notes added to DataBase"
            
        return "Reading failed"

    except Error as error:
        return f"Reading Failed: {str(error)}"
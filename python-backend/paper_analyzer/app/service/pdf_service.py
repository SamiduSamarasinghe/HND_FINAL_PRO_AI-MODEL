import fitz  # PyMuPDF
from io import BytesIO
from fastapi import UploadFile

async def process_pdf(file: UploadFile):
    if file is not None:
        contents = await file.read()
        pdf_stream = BytesIO(contents)

        # Open the PDF 
        doc = fitz.open(stream=pdf_stream, filetype="pdf")

        for page in doc:
            text = page.get_text()
            print(text)

        return "Read successful"
    return "Reading failed"
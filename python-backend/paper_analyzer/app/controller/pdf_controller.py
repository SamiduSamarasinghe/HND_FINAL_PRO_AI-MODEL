from fastapi import APIRouter,UploadFile, File, HTTPException, Form, Query
from app.service.pdf_service import process_pdf
from app.service.frequency_analyizer import analyse_frequent_questions


router = APIRouter()

#POST http:localhost:port/pdf-reader?isPaper=

@router.post("/pdf-reader")
async def upload_file(
        isPaper: bool = Query(...),
        subject: str = Query(...),
        file: UploadFile = File(...)
):
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF Files are Allowed")

        print(f"Received: subject='{subject}', isPaper={isPaper}, file='{file.filename}'")

        results = await process_pdf(isPaper, file, subject)
        return {"filename": file.filename, "subject": subject, "message": results}

    except Exception as error:
        print(f"Controller error: {error}")
        return f"Reading Failed: {str(error)}"
    

#this method should be update to require type of paper to be analyse
#http://localhost:[port]/pdf-reader/analyse?subject=statistics-papers
@router.get("/pdf-reader/analyse")
async def analyse_frequent_questions(subject: str = None):
    try:
        print("start analysing")
        if(subject is None):
            return "impelment analyse all subjects"
        else:
            return analyse_frequent_questions(subject)
    except Exception as e:
        print("Error :",str(e))
        return "Server Error"

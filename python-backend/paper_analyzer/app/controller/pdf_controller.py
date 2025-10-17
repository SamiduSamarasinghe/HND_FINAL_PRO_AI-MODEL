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
    

#http://localhost:[port]/pdf-reader/analyze?subject=statistics
@router.post("/pdf-reader/analyze")
async def analyse_questions(subject: str = None,file: UploadFile = File(None)):
    try:
        print("start analysing")
        if(subject is None and file is None):
            #TODO:analyse all type of papers give out over all analysis
            return await analyse_frequent_questions()

        if(file is None):
            return await analyse_frequent_questions(subject)
        else:
            return await analyse_frequent_questions(subject,file)
    except Exception as e:
        print("Error :",str(e))
        return "Server Error"

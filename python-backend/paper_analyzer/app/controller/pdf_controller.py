from fastapi import APIRouter,UploadFile, File, HTTPException
from app.service.pdf_service import process_pdf
from app.service.frequency_analyizer import analyseFrequentlyAskedQuestions
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
import asyncio



router = APIRouter()

#POST http:localhost:port/pdf-reader?isPaper=

@router.post("/pdf-reader")
async def upload_file(isPaper: bool ,file: UploadFile = File(...)):
   
    try:
        if(isPaper == True or isPaper == False):

            if file.content_type != "application/pdf":
                raise HTTPException (status_code=400, detail="Only PDF Files are Allowed")

            results = await process_pdf(isPaper,file)
            return {"Filename:":file.filename, "message":results}        
                
                
    except Exception as error:
        return f"Reading Failed: {(error)}"
    

#testing method for return progress updates
async def pdf_reader_progress_updates(isPaper: bool,file:UploadFile=File(...)):
    yield "data: Processing started...\n\n"
    await asyncio.sleep(1)

    # Step 2
    yield "data: Validating PDF...\n\n"
    await asyncio.sleep(1)

    # Step 3
    yield "data: Extracting text...\n\n"
    await asyncio.sleep(1)

    # Step 4
    yield "data: Cleaning data...\n\n"
    
#this method should be update to require type of paper to be analyse
#http://localhost:[port]/pdf-reader/analyse?subject=statistics-papers
@router.get("/pdf-reader/analyse")
async def analyseFrequentAskedQuestions(subject: str = None):
    try:
        print("start analysing")
        if(subject is None):
            return "impelment analyse all subjects"
        else:
            return analyseFrequentlyAskedQuestions(subject)
    except Exception as e:
        print("Error :",str(e))
        return "Server Error"



@router.get("/pdf-reader/health")
async def checkHealth():
    try:
        return  JSONResponse(status_code=200,content={"details":"Running"})
    except Exception as e:
        print("Error :",str(e))
        return JSONResponse(status_code=503,content={"details":"Server Unavailable"})
from fastapi import APIRouter,UploadFile, File, HTTPException
from app.service.pdf_service import process_pdf
from app.service.frequency_analyizer import analyse_frequent_questions,analyse_new_paper
from fastapi.responses import JSONResponse
from app.service.ai_model import generte_questions


router = APIRouter(prefix="/questions")

#POST http:localhost:port/questions
@router.post("/")
async def upload_file(file: UploadFile = File(...)):

    try:
        if file.content_type != "application/pdf":
            raise HTTPException (status_code=400, detail="Only PDF Files are Allowed")

        results = await process_pdf(file,True)
        return {"Filename:":file.filename, "message":results}

    except Exception as error:
        return f"Reading Failed: {(error)}"


#http://localhost:[port]/questions/analyse?subject=statistics
@router.get("/analyse")
async def analyse_questions(subject: str = None , file: UploadFile = File(...)):
    try:
        if(file.content_type !="application/pdf"):
            return HTTPException (status_code=400, detail="Only PDF File are Allowed")
        print("start analysing")
        if(subject is None):
            return "No subject provided"
        if(file is None):
            return analyse_frequent_questions(subject)
        else:
            result = await process_pdf(file,False)
            test = analyse_new_paper(subject,result)
            return f"""{test}"""

    except Exception as e:
        print("Error :",str(e))
        return "Unexpected Server Error"

#http://localhost:[port]/questions/
@router.get("/")
async def generate_questions(subject: str =None ,generate:int = None):
    try:
        if(subject is None):
            return "No subject provided"

        generte_questions(subject,generate)

    except Exception as e:
        print("Error",str(e))
        return f"""Unexpected Server Error {e}"""


#http://localhost:[port]/questions/health
@router.get("/health")
async def check_health():
    try:
        return  JSONResponse(status_code=200,content={"details":"Running"})
    except Exception as e:
        print("Error :",str(e))
        return JSONResponse(status_code=503,content={"details":"Server Unavailable"})
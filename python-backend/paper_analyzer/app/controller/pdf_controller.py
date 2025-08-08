from fastapi import APIRouter,UploadFile, File, HTTPException
from app.service.pdf_service import process_pdf


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
from fastapi import APIRouter,UploadFile, File, HTTPException
from app.service.pdf_service import process_pdf


router = APIRouter()

@router.post("/pdf-reader")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException (status_code=400, detail="Only PDF Files are Allowed")
    
    results = await process_pdf(file)
    return {"Filename:":file.filename, "message":results}
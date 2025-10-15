from csv import excel

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.model.test_models import GeneratedTest
from app.service.pdf_export_service import PDFExportService
from io import BytesIO

router = APIRouter()
pdf_service = PDFExportService()

@router.post("/export/test-pdf")
async def export_text_pdf(test: GeneratedTest):
    """
    Generate and download PDF
    """
    try:
        pdf_bytes = pdf_service.generate_test_pdf(test)

        #Create filename
        filename = f"{test.subject}_{test.difficulty}_test.pdf"
        filename = filename.replace(" ", "_").lower()

        #Return as streaming response
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

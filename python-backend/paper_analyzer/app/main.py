from fastapi import FastAPI
from app.controller.exam_question_controller import router
from app.controller.pdf_controller import router as pdf_router
from app.controller.test_generation_controller import  router as test_router
from app.controller.pdf_export_controller import router as export_router
from fastapi.middleware.cors import  CORSMiddleware

app = FastAPI(title="EduGen-AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf_router, prefix="/api/v1")
app.include_router(test_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "EduGen-AI Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EduGen-AI Backend"}
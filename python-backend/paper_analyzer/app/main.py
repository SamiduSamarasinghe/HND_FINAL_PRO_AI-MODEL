from fastapi import FastAPI
from app.controller.pdf_controller import router as pdf_router
from app.controller.test_generation_controller import  router as test_router
from app.controller.pdf_export_controller import router as export_router
from app.controller.gemini_controller import router as gemini_router
from app.controller.feedback_controller import router as feedback_router
from fastapi.middleware.cors import  CORSMiddleware

app = FastAPI(title="EduGen-AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173" "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf_router, prefix="/api/v1")
app.include_router(test_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
app.include_router(gemini_router,prefix="/api/v1/gemini")
app.include_router(feedback_router,prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "EduGen-AI Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EduGen-AI Backend"}
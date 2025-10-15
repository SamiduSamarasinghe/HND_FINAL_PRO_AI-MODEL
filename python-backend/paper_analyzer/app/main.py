from fastapi import FastAPI
from app.controller.pdf_controller import router as pdf_router
from app.controller.test_generation_controller import  router as test_router
from fastapi.middleware.cors import  CORSMiddleware

app = FastAPI(title="EduGen-AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", # Create react app
        "http://localhost:5173", # Vite default port
        "http://localhost:5174", # Vite alternate port
        "http://127.0.0.1:5173", # Vite with IP
        "http://127.0.0.1:5174" # vite alternative with IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf_router, prefix="/api/v1")
app.include_router(test_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "EduGen-AI Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EduGen-AI Backend"}
from fastapi import FastAPI
from app.controller.pdf_controller import router

app = FastAPI()
app.include_router(router)
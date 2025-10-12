from fastapi import FastAPI
from app.controller.exam_question_controller import router

app = FastAPI()
app.include_router(router)
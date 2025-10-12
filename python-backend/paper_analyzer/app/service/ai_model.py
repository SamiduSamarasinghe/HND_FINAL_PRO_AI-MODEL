import fitz  # PyMuPDF
import os, re ,time
import app.config.server_config as config
from ctransformers import AutoModelForCausalLM
from app.service.frequency_analyizer import analyse_frequent_questions

# Global variables
_questions = []
__chunkSize = 9

# Load Mistral model
base_dir = os.path.dirname(__file__)
model_path = os.path.abspath(os.path.join(base_dir, "..", "..", "resources", "mistral-7b-instruct-v0.1.Q4_K_S.gguf"))

if config.USE_CPU_FOR_AI:
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        model_type="mistral",
        local_files_only=True
    )
    print("Model running on - CPU")
else:
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        model_type="mistral",
        gpu_layers=15
    )
    print("Model running on - GPU")

def extract_core_logic(cleaned_questions):
    """
    Sends each question to the model, simplifies it to core logic, 
    and returns a cleaned list of all simplified tasks.
    Also prints the execution time.
    """
    start_time = time.time()
    final_core_logics = []

    for q in cleaned_questions:
        # Build a precise instruction prompt
        prompt = f"""
            You are given an exam question. Your task is to extract ONLY the core logic, following these rules strictly:

            1. Do NOT answer the question.
            2. Do NOT create new questions.
            3. Remove all numbers, datasets, examples, or extra explanations.
            4. Keep only the essential task or action being asked.
            5. Output ONE line per sub-question.
            6. Output ONLY the simplified text, nothing else — no labels, no "Answer:", no bullets, no "Core logic" text.

            Question:
            {q}

            Output:
            """
        response = model(prompt)   # <-- your AI model call

        # Post-processing
        lines = response.strip().splitlines()
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            # Remove empty lines and lines with mostly numbers or symbols
            if line and not re.match(r'^[\d\.\-\(\)=\s/]+$', line):
                cleaned_lines.append(line)
        if cleaned_lines:
            # Join sub-question lines with semicolon or keep separate
            final_core_logics.append("; ".join(cleaned_lines))

    end_time = time.time()
    execution_time = end_time - start_time

    print(f"\n=== FINAL SIMPLIFIED CORE LOGICS ===")
    print("-" * 50)
    for i, logic in enumerate(final_core_logics, 1):
        print(f"{i}. {logic}")
    print("-" * 50)
    print(f"Total questions processed: {len(final_core_logics)}")
    print(f"Execution time: {execution_time:.2f} seconds")

    return final_core_logics

def generte_questions(subject, questionCount):
    print("-----------from gen--question---------\n")

    # Step 1: Analyze frequent questions
    result = analyse_frequent_questions(subject)
    print("Analysis results obtained.")

    # Step 2: Extract the repeated questions only
    repeated_questions = result.get("repeated_questions", [])

    if not repeated_questions:
        print(" No repeated questions found.")
        return

    # Step 3: Take only up to questionCount (if provided)
    questions_to_generate = repeated_questions[:questionCount] if questionCount else repeated_questions

    print(f" Sending {len(questions_to_generate)} questions to AI model...\n")

    # Step 4: Loop through and send each question to your AI model
    for i, q_data in enumerate(questions_to_generate, start=1):
        question_text = q_data["question"].strip()
        print(f"\n Original Question {i}: {question_text}")

        prompt = f"""
            You are an AI agent specialized in improving academic questions.
            
            Your task is to take the provided text and turn it into a clear, complete, and grammatically correct question.
            If the text is incomplete or unclear, infer the most reasonable and relevant question meaning from the given words — 
            for example, if it's just 'calculate the mean median and mode', you can rewrite it as 
            'Given a data set, calculate the mean, median, and mode.'
            
            Rules:
            - Keep the topic and difficulty level similar to the original.
            - Provide simple dataset if you can
            - If a numerical value or context is missing, assume a generic phrasing (e.g., “from the given data”).
            - Avoid giving answers or explanations — only output one clear question.
            - Output format:
              --- Final Question ---
              <your rewritten or corrected question>
            
            --- Original Text ---
            {question_text}
            """



        respond = model(prompt)
        print(f"[AI generated question: {respond}]")

    print("\n Finished generating new questions.\n")


import re

def clean_anaylsiezation(text: str):
    """
    Cleans up the frequently asked questions text by removing counts and estimates.
    Example input lines:
    '2 times: calculate the mean median and mode | Estimated chance of appearing again: 80.00%'
    """
    cleaned_questions = []

    # Split the text into lines
    for line in text.splitlines():
        line = line.strip()

        # Skip empty or irrelevant lines
        if not line or line.startswith('===') or line.startswith('Total') or line.startswith('Questions'):
            continue

        # Remove patterns like "2 times:", "4 times:" etc.
        line = re.sub(r'^\d+\s+times:\s*', '', line)

        # Remove the " | Estimated chance of appearing again: 60.00%" part
        line = re.sub(r'\s*\|\s*Estimated chance.*$', '', line)

        # Keep only non-empty question lines
        if line:
            cleaned_questions.append(line)

    return cleaned_questions



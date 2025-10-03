import fitz  # PyMuPDF
import os, re
import app.config.server_config as config
from ctransformers import AutoModelForCausalLM

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

import time

def extractCoreLogic(cleaned_questions):
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


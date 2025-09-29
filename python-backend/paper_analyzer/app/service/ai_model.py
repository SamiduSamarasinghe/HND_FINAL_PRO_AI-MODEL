import fitz  # PyMuPDF
import os, re, unicodedata
import app.config.server_config as config
from ctransformers import AutoModelForCausalLM

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



#this is currently not being used
def extractQuestions(pages):
    textGiven = cleanPageText(pages)
    prompt = f"""
            You are an AI assistant specialized in processing exam papers.

            Instructions:
            1. Remove all headers, footers, page numbers, university names, course info, exam dates, and any repeated instructions.
            2. Keep only the exam questions, marks, and sub-parts.
            3. Preserve numbering and sub-parts (e.g., 1., 2., a., b., c.).
            4. Ignore raw datasets, repeated numbers, or extraneous text.
            5. Do not add explanations or answers.
            6. Format the output clearly and neatly.

            --- BEGIN TEXT ---
            {textGiven}
            --- END TEXT ---

            Return the cleaned content as a simple numbered list of questions.
            """
    # response = model(prompt)
    # print("\n",response)


def cleanPageText(pages, n_header_lines=9):
    """
    Cleans PDF text:
    - Removes empty lines
    - Removes header (first n lines) only from the first page
    """
    # Split text into pages (assuming you have a page break marker)
    # If your text uses "--- Page Break ---" between pages:
    page_texts = pages.split("\n--- Page Break ---\n")
    
    cleaned_pages = []
    
    for i, page in enumerate(page_texts):
        # Remove empty lines from this page
        lines = [line for line in page.splitlines() if line.strip() != ""]
        
        # Remove header only on the first page
        if i == 0:
            lines = lines[n_header_lines:]
        
        # Join the cleaned lines back
        cleaned_pages.append("\n".join(lines))
    
    # Join all pages back into one string with page breaks
    cleaned_text = "\n--- Page Break ---\n".join(cleaned_pages)
    
    print(cleaned_text)
    print("\nNumber of lines:", sum(len(p.splitlines()) for p in cleaned_pages))
    print("\nNumber of characters:", len(cleaned_text))
    
    print(cleaned_text)
    return cleaned_text



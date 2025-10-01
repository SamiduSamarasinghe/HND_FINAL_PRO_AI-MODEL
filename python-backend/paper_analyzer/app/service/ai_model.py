import fitz  # PyMuPDF
import os, re, unicodedata
import app.config.server_config as config
from ctransformers import AutoModelForCausalLM

_questions = []
__chunkSize = 10
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
        gpu_layers=20
    )
    print("Model running on - GPU")


def extractQuestionLogic(pages):
    textGiven = cleanPageHeader(pages)

    _questionChuck ="\n\n".join(_questions[:10])

    prompt = f""" 
        You are an AI assistant specialized in understanding exam questions. 
        Instructions: 
        1. Read the given exam questions carefully. 
        2. Ignore headers, footers, marks, datasets, and extraneous text. 
        3. Extract the **core logic** or the **main task** of each question. 
        4. Do not solve the questions; only describe what the question is asking. 
        5. Preserve numbering or sub-parts for clarity, if present. 
        6. Output in a simple, concise numbered or bulleted list. 
        
        --- BEGIN QUESTIONS --- {_questionChuck} --- END QUESTIONS --- """

    response = model(prompt)
    print("\n","\n","Model output----------------")
    print("\n",response)


def cleanPageHeader(pages, n_header_lines=9):
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
    splitQuestions(cleaned_text)
    return cleaned_text

def removeEmptyLines(questions):
    cleaned_questions = []
    for q in questions:
        # split into lines, remove empty ones, and rejoin
        lines = q.splitlines()
        non_empty = [line for line in lines if line.strip()]  # keep only non-empty
        cleaned_questions.append("\n".join(non_empty))
    return cleaned_questions



def splitQuestions(page):
    #question starting patterns
    pattern = re.compile(r"""
                            ^(?:
                                Question\s+No\.?\s*\d+  |   #find "Question No.1"
                                \d+\.\s*                |   #find "1."
                                \[a-z]\.\s*             |   #find "a.1"
                                \(?[ivx]+\)             |   #find "ii."
                            )
                         """,re.IGNORECASE | re.MULTILINE |re.VERBOSE)
    
    matches = list(pattern.finditer(page))


    for i, match in enumerate(matches):
        start = match.start()
        end =  matches[i+1].start() if i+1 < len(matches) else len(page)
        _questions.append(page[start:end].strip())

    print("\n","\n")
    print("chuckned questions 1-5 in questions in array")
    
    #for debuging
    for i, question in enumerate(_questions[:10],1):
            print(_questions[i])






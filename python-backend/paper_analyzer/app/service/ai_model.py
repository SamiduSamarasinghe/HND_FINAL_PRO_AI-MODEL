import fitz  # PyMuPDF
import os, re, unicodedata
import app.config.server_config as config
from ctransformers import AutoModelForCausalLM

# === Load Mistral model ===
base_dir = os.path.dirname(__file__)
model_path = os.path.abspath(os.path.join(base_dir, "..", "..", "resources", "mistral-7b-instruct-v0.1.Q4_K_S.gguf"))

if(config.USE_CPU_FOR_AI == True):
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
    gpu_layers=15 # Enables GPU acceleration - redeuse this to lower gpu load
    )
    print("Model running on - GPU")

def head_lines(txt, max_lines=15, max_chars=800):
    txt = unicodedata.normalize("NFKC", txt)
    txt = txt.replace("\r\n", "\n").replace("\r", "\n")
    txt = txt.replace("\xa0", " ").replace("\u200b", "")
    lines = [ln.strip() for ln in txt.split("\n")]
    lines = [ln for ln in lines if ln]
    s = "\n".join(lines[:max_lines]).strip()
    if len(s) > max_chars:
        s = s[:max_chars].rstrip()
    return s

def findPaperName(firstPage):
    trimmed_text = head_lines(firstPage, max_lines=15, max_chars=800)
    print(trimmed_text)

    prompt = f"""
    Extract the following information from the given exam paper header and return it in a structured format:
    Institute: The name of the institute (short form + full form if available).
    Programs: A list of programs mentioned (e.g., Higher Diplomas), including the year.
    Module/Subject: The main subject/module of the paper.
    Exam Date: The date of the exam in DD Month YYYY format.
    --- BEGIN TEXT ---
    {trimmed_text}
    --- END TEXT ---
    """

    response = model(prompt)
    print(response)
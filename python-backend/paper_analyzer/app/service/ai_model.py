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
        max_new_tokens=2048,
        gpu_layers=20
    )
    print("Model running on - GPU")

def extractCoreLogic(pages):
    prompt = "print 1+1"
    responce = model(prompt)
    print(prompt)
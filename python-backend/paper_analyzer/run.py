import uvicorn
import sys
import subprocess
import app.config.server_config as config

# Mapping of import name -> pip package name
PACKAGE_MAP = {
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "fitz": "pymupdf",  # PyMuPDF provides fitz
    "firebase_admin": "firebase-admin"
}

def ensure_packages(package_map):
    for import_name, pip_name in package_map.items():
        try:
            __import__(import_name)
            print(f"{import_name} is already installed.")
        except ImportError:
            print(f" Installing missing package: {pip_name} ...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name])
            print(f" Successfully installed {pip_name}.")

ensure_packages(PACKAGE_MAP)

# Start server
if __name__ == "__main__":
    print("\n Starting FastAPI server...\n")
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD
    )
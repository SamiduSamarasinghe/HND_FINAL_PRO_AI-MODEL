import sys
import subprocess
import app.config.server_config as config

# winget install --id Microsoft.VisualStudio.2022.BuildTools
# winget install --id Kitware.CMake

#python -m pip install --upgrade pip
# pip install ctransformers

# Mapping of import name -> pip package name
PACKAGE_MAP = {
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "fitz": "pymupdf",  # PyMuPDF provides fitz
    "firebase_admin": "firebase-admin",
    "multipart": "python-multipart",
    "ctransformers":"ctransformers"

    # "transformers":"transformers",  # Inorder To use Large-Languag-Model
    # "accelerate":"accelerate",
    # "bitsandbytes":"bitsandbytes",
}

def __check_python_version():
    version_str = subprocess.check_output([sys.executable,"--version"],text=True)
    
    if version_str.lower().startswith("python "):
        version_str = version_str[7:]
    return tuple(map(int, version_str.split(".")))  # e.g., (3, 11, 9)

def ensure_packages(package_map):
    for import_name, pip_name in package_map.items():
        try:
            __import__(import_name)
            print(f"{import_name} is already installed.")
        except ImportError:
            
            print(f" Installing missing package: {pip_name} ...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name])
            print(f" Successfully installed {pip_name}.")

# # Start server
if __name__ == "__main__":
    ensure_packages(PACKAGE_MAP)
    py_version = __check_python_version()
    if(py_version[:2] == (3,11)):  #allow every python 3.11.x versions
        print("\n Starting FastAPI server...\n")
        import uvicorn
        uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD
    )
    else:
        print("Please use Python 3.11.x (e.g., 3.11.9). Your version:", py_version)
        print("\n","use this command to install requierd version: winget install --id Python.Python.3.11")
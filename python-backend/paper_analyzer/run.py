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
    "rapidfuzz":"rapidfuzz",
    "pydantic": "pydantic",
    "python_multipart": "python-multipart",
    "reportlab": "reportlab",
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


def install_ctransformers(cuda_enabled: bool):
    package_name = "ctransformers[cuda]" if cuda_enabled else "ctransformers"
    
    needs_install = False
    try:
        import ctransformers
        # Check if the installed package is GPU-enabled
        is_cuda = getattr(ctransformers, "is_cuda_available", False)
        if cuda_enabled and not is_cuda:
            print("CPU-only ctransformers detected, upgrading to CUDA version...")
            needs_install = True
        elif not cuda_enabled and is_cuda:
            print("CUDA-enabled ctransformers detected, switching to CPU version...")
            needs_install = True
        else:
            print(f"ctransformers is already installed with correct variant (CUDA={is_cuda}).")
    except ImportError:
        needs_install = True
    
    if needs_install:
        print(f" Installing {package_name} ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", package_name])
        print(f" Successfully installed {package_name}.")

def install_genai():
    try:
        import google.genai
        print("Google genai is is already installed.")
    except ImportError:
        print("Installing google genai")
        subprocess.check_call([sys.executable,"-m","pip","install","-q","-U","google-genai"])
        print("Successfully installed google genai")



# # Start server
if __name__ == "__main__":
    ensure_packages(PACKAGE_MAP)
    install_genai()
    install_ctransformers(cuda_enabled=not config.USE_CPU_FOR_AI)
    print("\n Starting FastAPI server...\n")
    import uvicorn
    uvicorn.run(
    "app.main:app",
    host=config.HOST,
    port=config.PORT,
    reload=config.RELOAD
    )
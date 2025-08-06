import uvicorn
import sys
import subprocess
import app.config.server_config as config

def ensure_packages(packages):
    for pkg in packages:
        try:
            __import__(pkg)
        except ImportError:
            print(f"🔧 Installing missing package: {pkg}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

ensure_packages(["fastapi", "uvicorn", "fitz", "firebase_admin"])

# Start server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD
    )
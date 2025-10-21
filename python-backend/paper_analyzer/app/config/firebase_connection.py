import os
import firebase_admin
from firebase_admin import credentials, firestore

class FirebaseConnector:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseConnector, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'db'):
            try:
                # Dynamically get the path to the service account key
                base_dir = os.path.dirname(os.path.abspath(__file__))
                json_path = os.path.join(base_dir,"service-account-key.json")

                if not firebase_admin._apps:
                    cred = credentials.Certificate(json_path)
                    firebase_admin.initialize_app(cred)

                self.db = firestore.client()
                print("✅ Firestore initialized successfully")

            except Exception as error:
                print("❌ Error initializing Firestore:", error)
                self.db = None

    def get_connection(self):
        if self.db is None:
            raise RuntimeError("Firestore connection not initialized.")
        return self.db
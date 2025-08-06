import firebase_admin 
from firebase_admin import credentials, firestore

class FirebaseConnector:

    _instanse = None

    def __new__(cls):
        if (cls._instanse != None):
            cls._instanse = super(FirebaseConnector,cls).__new__(cls)
        return cls._instanse
    
    def __init__(self):
        if (not hasattr ,'db'):
            try:
                cred = credentials.Certificate("D:\HNDSE_242\HND_FINAL_PRO_AI-MODEL\python-backend\paper_analyzer\paper-analyzer\firebase\service-account-key.json")
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                print("FireStore initializing  successful")
            except Error as error:
                print("Error initializing FireSote :",error)
                
    def get_connection(self):
        return self.db
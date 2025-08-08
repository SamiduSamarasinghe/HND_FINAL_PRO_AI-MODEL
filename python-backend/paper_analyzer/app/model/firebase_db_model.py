from app.config.firebase_connection import FirebaseConnector
from firebase_admin import firestore

connector = FirebaseConnector()
__db = connector.get_connection()

def saveToFirebase(pageContentsList: list[str]):
    try:
        if(pageContentsList is not None):
            pageData = []

            for i, page_text in enumerate(pageContentsList, start=1):
                pageData.append({
                    "pageNumber": i,
                    "content": page_text
                })

            #make all into one document
            data = {
                "pages": pageData,
                "uploadedAt": firestore.SERVER_TIMESTAMP
            }

            __db.collection("past-paper-contents").add(data)

            return "File Saved succsesfuly"
        else:
            return "No Content to Save"
        
    except Exception as error:
        return f"Saving Failed: {str(error)}"
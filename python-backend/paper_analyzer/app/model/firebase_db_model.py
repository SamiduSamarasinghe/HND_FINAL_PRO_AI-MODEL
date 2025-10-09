from app.config.firebase_connection import FirebaseConnector
from firebase_admin import firestore

connector = FirebaseConnector()
__db = connector.get_connection()


#futuer impelmetation = add paper detail header to the content (eg:year,univercity,uploaded date ....etc)
def saveToFirebase(content: str):
    try:
        if content:
            data = {
                "content": content,
                "uploadedAt": firestore.SERVER_TIMESTAMP
            }

            __db.collection("statistics-papers").add(data)
            return "File Saved successfully"
        else:
            return "No Content to Save"

    except Exception as error:
        return f"Saving Failed: {str(error)}"

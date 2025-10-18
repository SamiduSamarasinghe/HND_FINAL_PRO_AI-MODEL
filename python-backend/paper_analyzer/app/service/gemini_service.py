from google import genai
from app.config.server_config import GEMINI_API_KEY as GEMINI_API_KEY

async def start_gemini_chat(prompt:str):
    try:
        client = genai.Client(api_key = GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",contents=f"{prompt}"
        )

        return extract_gemini_response(response.to_json_dict())

    except Exception as error:
        print(f"Error{error}")
        return error

#call this method to clean out the json response from gemini and get the actual response
def extract_gemini_response(response_json:dict)->str:
    try:
        parts = (response_json.get("candidates",[{}])[0]
                    .get("content",{})
                    .get("parts",[]))

        response = "\n".join(part.get("text","")for part in parts) if parts else ""

        print("actual-repones\n")
        print(response)
        return response
    except Exception as error:
        print(f"Error extracting response {error}")
        return f"Error extracting response {error}"

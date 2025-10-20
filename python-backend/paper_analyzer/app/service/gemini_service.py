from fastapi import UploadFile
from google import genai
import re,json
from app.service.pdf_service import read_mock_test_papers
from app.config.server_config import GEMINI_API_KEY as GEMINI_API_KEY
from app.model.firebase_db_model import save_mock_test_feed_back

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

async def start_grading(userid,file:UploadFile):
    try:
        file_data = await read_mock_test_papers(file)
        file_subject = file_data["subject"]
        file_q_a_block = file_data["questions"]
        prompt = f"""
                You are an expert teacher in the subject "{file_subject}". You are given a student’s answers in JSON format.
                
                Your task is to:
                1. Grade each question based on correctness and completeness.
                2. Assign a score for each question based on the "Points" field.
                3. Provide feedback for each question.
                4. Suggest improvements for answered questions where applicable.
                5. Give overall feedback, total score, and areas for improvement.
                
                Input:
                {file_q_a_block}
                
                    Output JSON Format:
                    {{
                      "subject": "...",
                      "total_score": <total points student scored>,
                      "max_score": <sum of all question points>,
                      "grade_percentage": <percentage score>,
                      "overall_feedback": "...",
                      "areas_to_improve": ["..."],
                      "suggested_improvements": [
                        {{
                          "question_number": <number>,
                          "your_answer": "...",
                          "improved_answer": "..."
                        }}
                      ],
                      "detailed_results": [
                        {{
                          "question_number": <number>,
                          "question": "...",
                          "points": <points possible>,
                          "score": <score given>,
                          "feedback": "..."
                        }}
                      ]
                    }}
                
                Make sure your output is valid JSON and matches the above structure exactly.
                """
        print("calling-gemini\n\n")
        client = genai.Client(api_key = GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",contents=f"{prompt}"
        )
        print(f"modle-responds\n{response}")

        response_dict = response.to_json_dict()
        res = clean_and_parse_gemini_json_response(extract_text_from_gemini_response(response_dict))
        print(res)

        status = save_mock_test_feed_back(res,userid)

        if status == "Feedback saved successfully":
            res["save_status"] = "Feedback saved successfully"
        else:
            res["save_status"] = "Failed to save feedback"

        return res


    except Exception as error:
        print(f"Error grading {error}")
        return (f"gemini-service Error grading{error}")



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



def extract_text_from_gemini_response(gemini_response):

    try:
        # Navigate through the response structure to find the text
        candidates = gemini_response.get('candidates', [])
        if candidates:
            first_candidate = candidates[0]
            content = first_candidate.get('content', {})
            parts = content.get('parts', [])
            if parts:
                first_part = parts[0]
                text_content = first_part.get('text')
                return text_content
        return None
    except (KeyError, IndexError, AttributeError) as e:
        print(f"Error extracting text: {e}")
        return None


def clean_and_parse_gemini_json_response(raw_response: str) -> dict:
    """
    Clean and parse JSON response from Gemini that contains markdown code blocks.

    Args:
        raw_response (str): The raw string response from Gemini

    Returns:
        dict: Parsed JSON as dictionary
    """
    try:
        # If the input is already a dictionary, return it directly
        if isinstance(raw_response, dict):
            return raw_response

        # Convert to string if it's not already
        response_text = str(raw_response)

        print("Raw response received:")
        print(response_text)
        print("\n" + "="*50 + "\n")

        # Method 1: Remove markdown code block markers
        cleaned_text = response_text.replace('```json\n', '').replace('```', '').strip()

        # Method 2: Use regex to extract JSON (more robust)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            cleaned_text = json_match.group(0)

        # Method 3: If both methods fail, try to find the JSON part
        if not cleaned_text or not cleaned_text.startswith('{'):
            # Look for the first occurrence of { and last occurrence of }
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                cleaned_text = response_text[start_idx:end_idx+1]

        print("Cleaned text for parsing:")
        print(cleaned_text)
        print("\n" + "="*50 + "\n")

        # Parse the JSON
        parsed_json = json.loads(cleaned_text)

        print("Successfully parsed JSON:")
        print(json.dumps(parsed_json, indent=2))

        return parsed_json

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Problematic text: {cleaned_text if 'cleaned_text' in locals() else 'N/A'}")

        # Try to fix common JSON issues
        try:
            # Fix escaped quotes and other common issues
            fixed_text = cleaned_text.replace('\\"', '"').replace('\\n', ' ').replace('\\t', ' ')
            parsed_json = json.loads(fixed_text)
            return parsed_json
        except:
            raise ValueError(f"Failed to parse JSON response: {e}")

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

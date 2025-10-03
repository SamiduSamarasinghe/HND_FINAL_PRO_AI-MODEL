from app.config.firebase_connection import FirebaseConnector
from collections import Counter
import re
import string

# Initialize Firestore client
connector = FirebaseConnector()
__db = connector.get_connection()


def fetch_all_papers():
    """
    Fetch all documents from 'past-paper-contents' collection.
    Returns a list of content strings.
    """
    papers_ref = __db.collection("statistics-papers")
    docs = papers_ref.stream()
    
    all_contents = []
    for doc in docs:
        data = doc.to_dict()
        if "content" in data:
            all_contents.append(data["content"])
    
    return all_contents


def extract_questions_from_content(content: str):
    """
    Extract questions from the 'Cleaned Questions' section of the content.
    """
    start_marker = "==========Cleaned Questions =========="
    end_marker = "=========="
    
    start_pos = content.find(start_marker)
    if start_pos == -1:
        return []
    
    start_pos += len(start_marker)
    end_pos = content.find(end_marker, start_pos)
    
    if end_pos == -1:
        questions_text = content[start_pos:]
    else:
        questions_text = content[start_pos:end_pos]
    
    # Split and clean questions
    questions = []
    for line in questions_text.split("\n"):
        line = line.strip()
        # Skip empty lines, single words, and very short fragments
        if (line and 
            not line.isdigit() and 
            not line.startswith("Page") and
            len(line) > 10 and  # Minimum length to avoid single words
            not line.lower() in ['age', 'weight', 'marks', 'harvest', 'rain', 'fertilizers', 'pesticide', 'x', 'y'] and
            not re.match(r'^[a-z]\s*$', line)):  # Skip single letters
            
            # Remove question numbers like "1.", "2." etc.
            if re.match(r'^\d+\.', line):
                line = re.sub(r'^\d+\.\s*', '', line)
            
            # Skip if it's just a variable name or single word after cleaning
            if len(line.split()) > 2:  # At least 3 words to be considered a proper question
                questions.append(line)
    
    return questions


def normalize_question(q: str):
    """
    Normalize a question: lowercase, remove punctuation, strip whitespace.
    Keep essential structure for meaningful comparison.
    """
    q = q.lower()
    # Remove punctuation but keep important symbols
    q = q.translate(str.maketrans('', '', string.punctuation.replace('?', '')))
    q = re.sub(r'\s+', ' ', q)  # Normalize whitespace
    return q.strip()


def is_proper_question(text: str):
    """
    Check if the text is a proper question and not just a word or fragment.
    """
    # Skip if too short
    if len(text) < 15:
        return False
    
    # Skip if it's just a list of variables or single concepts
    if len(text.split()) <= 2:
        return False
    
    # Skip common non-question patterns
    non_question_patterns = [
        r'^[a-z]\s*$',  # Single letters
        r'^\d+\s*$',    # Single numbers
        r'^[a-z]+\s*[a-z]*\s*$',  # One or two words only
    ]
    
    for pattern in non_question_patterns:
        if re.match(pattern, text.lower()):
            return False
    
    return True


def get_frequent_questions(all_contents):
    """
    Count frequency of each question across all papers.
    Returns a Counter object.
    """
    all_questions = []
    for content in all_contents:
        questions = extract_questions_from_content(content)
        # Filter and normalize
        proper_questions = [normalize_question(q) for q in questions if is_proper_question(q)]
        all_questions.extend(proper_questions)
    
    freq_counter = Counter(all_questions)
    return freq_counter


def debug_extraction():
    """
    Debug function to see what's being extracted from the content.
    """
    all_contents = fetch_all_papers()
    
    for i, content in enumerate(all_contents[:3]):
        print(f"\n--- Paper {i+1} ---")
        
        questions = extract_questions_from_content(content)
        print(f"Extracted {len(questions)} questions:")
        for j, q in enumerate(questions[:8]):  # Show first 8
            print(f"  {j+1}. {q}")
        
        print(f"\nFiltered to {len([q for q in questions if is_proper_question(q)])} proper questions")

def analyseFrequentlyAskedQuestions():
    """
    Main function to analyze and find frequently asked questions, including
    estimated probability of appearing again.
    Returns a dictionary containing analysis results.
    """
    all_contents = fetch_all_papers()
    total_papers = len(all_contents)

    if total_papers == 0:
        print("No papers found in Firestore.")
        return None

    print(f"Found {total_papers} papers in Firestore")
    
    # Run debug first
    debug_extraction()
    
    freq_counter = get_frequent_questions(all_contents)
    
    total_unique_questions = len(freq_counter)

    # Get questions that appear more than once and are proper questions
    frequent_questions = [(q, count) for q, count in freq_counter.most_common() 
                         if count > 1 and is_proper_question(q)]
    repeated_count = len(frequent_questions)
    
    # Calculate percentage of repeated questions
    repeated_percentage = (repeated_count / total_unique_questions * 100) if total_unique_questions > 0 else 0

    # Estimate probability of appearing again (Laplace smoothing)
    repeat_probabilities = {q: (count + 1) / (total_papers + 2) 
                            for q, count in frequent_questions}

    # Print to console
    print(f"\n=== FREQUENTLY ASKED QUESTIONS ANALYSIS ===")
    print(f"Total papers analyzed: {total_papers}")
    print(f"Total unique proper questions found: {total_unique_questions}")
    print(f"Questions appearing more than once: {repeated_count} ({repeated_percentage:.2f}%)\n")
    
    repeated_questions_list = []
    if frequent_questions:
        print("=== FREQUENTLY REPEATED QUESTIONS ===")
        for question, count in frequent_questions:
            probability = repeat_probabilities[question] * 100
            print(f"{count} times: {question} | Estimated chance of appearing again: {probability:.2f}%")
            repeated_questions_list.append({
                "question": question,
                "count": count,
                "estimated_probability": probability
            })
    else:
        print("No proper questions appeared more than once")
        
        # Show top 20 anyway
        print("\n=== ALL PROPER QUESTIONS (showing top 20) ===")
        for question, count in freq_counter.most_common(20):
            print(f"{count} times: {question}")

    # Save to file
    with open("frequent_questions.txt", "w", encoding="utf-8") as f:
        f.write("=== FREQUENTLY ASKED QUESTIONS ANALYSIS ===\n")
        f.write(f"Total papers analyzed: {total_papers}\n")
        f.write(f"Total unique proper questions found: {total_unique_questions}\n")
        f.write(f"Questions appearing more than once: {repeated_count} ({repeated_percentage:.2f}%)\n\n")
        
        if frequent_questions:
            f.write("=== FREQUENTLY REPEATED QUESTIONS ===\n")
            for question_data in repeated_questions_list:
                f.write(f"{question_data['count']} times: {question_data['question']} | "
                        f"Estimated chance of appearing again: {question_data['estimated_probability']:.2f}%\n")
        else:
            f.write("No proper questions appeared more than once\n\n")
            f.write("=== ALL PROPER QUESTIONS (top 20) ===\n")
            for question, count in freq_counter.most_common(20):
                f.write(f"{count} times: {question}\n")

    print(f"\nResults saved to 'frequent_questions.txt'")

    # Return analysis as dictionary
    return {
        "total_papers": total_papers,
        "total_unique_questions": total_unique_questions,
        "repeated_count": repeated_count,
        "repeated_percentage": repeated_percentage,
        "repeated_questions": repeated_questions_list
    }

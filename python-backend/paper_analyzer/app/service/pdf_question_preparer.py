import re
_questionsList = []

def get_clean_questions(pages):
    """
    Extract questions from pages and analyze them in chunks for core logic.
    """
    textGiven = normalizePdfQuestions(pages)
    return _questionsList

def normalizePdfQuestions(pages, n_header_lines=9):
    """
    Cleans PDF text:
    - Removes empty lines
    - Removes header (first n lines) only from the first page
    - Removes page break markers
    - Removes marks patterns like "(marks 20)", "[20 marks]", etc.
    - Removes dataset lines (numbers, tables, column headers)
    - Removes other common PDF artifacts
    """
    page_texts = pages.split("\n--- Page Break ---\n")
    cleaned_pages = []

    # Patterns to remove marks
    marks_pattern = re.compile(
        r'\(marks?\s*\d+\)|'          # (marks 20), (mark 5)
        r'\[marks?\s*\d+\]|'          # [marks 20], [mark 5]
        r'\(\d+\s*marks?\)|'          # (20 marks), (5 mark)
        r'\[\d+\s*marks?\]|'          # [20 marks], [5 mark]
        r'\b\d+\s*marks?\b|'          # 20 marks, 5 mark
        r'Marks?\s*:\s*\d+|'          # Marks: 20, Mark: 5
        r'\(Maximum\s*Marks?\s*:\s*\d+\)|'  # (Maximum Marks: 20)
        r'\[?Total\s*Marks\s*[-–]\]?|'
        r'Total\s*Marks?\s*:\s*\d+',  # Total Marks: 20
        re.IGNORECASE
    )

    # Page break pattern
    page_break_pattern = re.compile(
        r'-{2,}\s*Page\s*Break\s*-{2,}|'
        r'^\s*\d+\s*\|\s*P\s*a\s*g\s*e\s*$',
          re.IGNORECASE)

    # Dataset-related patterns
    dataset_header_pattern = re.compile(
        r'^(Time|Branch|Products|Sales|Quantity|Dimension|Product|Ti|W\d+)\b', re.IGNORECASE
    )
    numeric_line_pattern = re.compile(r'^([\d,\.\-]+\s*)+$')  # Lines mostly numbers, like "81, 56, 35"

    for i, page in enumerate(page_texts):
        lines = []
        for line in page.splitlines():
            clean_line = line.strip()
            if not clean_line:
                continue

            # Remove page break markers
            clean_line = page_break_pattern.sub('', clean_line)

            # Remove marks patterns
            clean_line = marks_pattern.sub('', clean_line)

            # Remove common PDF artifacts
            if re.match(r'^(Page\s*\d+\s*(of\s*\d+)?|\d+\s*/\s*\d+)$', clean_line, re.IGNORECASE):
                continue
            if re.match(r'^\d+$', clean_line):
                continue

            # Remove dataset headers or numeric lines
            if dataset_header_pattern.match(clean_line):
                continue
            if numeric_line_pattern.match(clean_line):
                continue

            if clean_line:
                lines.append(clean_line)

        # Remove header from first page only
        if i == 0 and len(lines) > n_header_lines:
            lines = lines[n_header_lines:]

        cleaned_pages.append("\n".join(lines))

    cleaned_text = "\n".join(cleaned_pages)

    # Final cleanup pass
    cleaned_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned_text)  # Reduce multiple newlines
    cleaned_text = re.sub(r'^\s+|\s+$', '', cleaned_text, flags=re.MULTILINE)  # Trim whitespace

    print(f"\nNumber of lines: {sum(len(p.splitlines()) for p in cleaned_pages)}")
    print(f"Number of characters: {len(cleaned_text)}")

    splitQuestions(cleaned_text)
    return cleaned_text



def splitQuestions(text):
    """
    Improved question splitting with better boundary detection
    """
    global _questionsList
    _questionsList = []  # Reset before adding

    # Enhanced pattern for question detection
    pattern = re.compile(r"""
        ^(?:                                  
            Question\s+No\.?\s*\d+          |  # "Question No 1", "Question No.1"
            \b\d+[\.\)]\s+                  |  # "1. ", "1) "
            \(\d+\)\s+                      |  # "(1) "
            [a-z]\)\s+                      |  # "a) "
            [ivx]+\.\s+                     |  # "i. ", "ii. "
            \b[Qq]\.?\s*\d+\.?\s*          |  # "Q1", "Q.1", "q1"
            Question\s*:?\s*               |  # "Question:", "Question"
            Part\s+[A-Z]\s+                |  # "Part A"
            Section\s+[A-Z]\s+             |  # "Section A"
            \b[A-D]\.\s+                   |  # "A. ", "B. " (for MCQs)
            \bANSWER\s+THE\s+FOLLOWING     |  # "ANSWER THE FOLLOWING"
            \b[A-Z][A-Z\s]+\:               # Uppercase headings followed by colon
        )
    """, re.MULTILINE | re.IGNORECASE | re.VERBOSE)

    # Split by major sections first
    sections = re.split(r'(?:Section|Part)\s+[A-Z]', text, flags=re.IGNORECASE)

    for section in sections:
        if not section.strip():
            continue

        matches = list(pattern.finditer(section))

        if not matches:
            # If no clear questions, try to split by line breaks for very clear separations
            potential_questions = re.split(r'\n\s*\n', section)
            for pq in potential_questions:
                pq = pq.strip()
                if len(pq) > 20 and len(pq) < 500:  # Reasonable question length
                    _questionsList.append(pq)
            continue

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(section)
            question_text = section[start:end].strip()

            # Clean the question text
            question_text = clean_single_question(question_text)

            if is_valid_individual_question(question_text):
                _questionsList.append(question_text)

    printQuestions()

def clean_single_question(text):
    """Clean individual question text"""
    # Remove common prefixes
    prefixes = [
        r'^\s*Question\s*(?:No\.?\s*)?\d+\s*[:.)-]?\s*',
        r'^\s*[Qq]\.?\s*\d+\s*[:.)]?\s*',
        r'^\s*\d+[\.\)]\s*',
        r'^\s*[a-z]\)\s*'
    ]

    for prefix in prefixes:
        text = re.sub(prefix, '', text)

    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    return text

def is_valid_individual_question(text):
    """
    Validate if this is a proper individual question
    """
    if not text or len(text) < 15:
        return False

    # Too long probably means multiple questions concatenated
    if len(text) > 500:
        return False

    # Should contain question indicators
    question_indicators = [
        'what', 'how', 'why', 'explain', 'describe', 'discuss',
        'calculate', 'find', 'determine', 'list', 'name', 'compare'
    ]

    text_lower = text.lower()
    if not any(indicator in text_lower for indicator in question_indicators):
        return False

    # Should not be all uppercase (probably a heading)
    if text.isupper():
        return False

    return True

def is_valid_question(text):
    """
    Enhanced validation to filter out content vs actual questions
    """
    if not text or len(text.strip()) < 15:
        return False

    # Length-based filtering
    text_length = len(text.strip())
    if text_length > 800:  # Too long - probably content
        return False
    if text_length < 25:   # Too short - probably fragment
        return False

    # Content pattern detection
    content_indicators = [
        'following are', 'as follows', 'below:', 'the following',
        'example:', 'for example', 'such as', 'including',
        'note:', 'important:', 'remember:', 'key points',
        'definition:', 'concept:', 'introduction', 'summary'
    ]

    text_lower = text.lower()
    if any(indicator in text_lower for indicator in content_indicators):
        return False

    # Question pattern detection
    question_indicators = [
        'what', 'how', 'why', 'when', 'where', 'which',
        'explain', 'describe', 'discuss', 'compare', 'contrast',
        'calculate', 'find', 'determine', 'list', 'name',
        'advantages', 'disadvantages', 'benefits', 'drawbacks'
    ]

    if not any(indicator in text_lower for indicator in question_indicators):
        return False

    # Should not be just a statement
    if text_lower.endswith('.') and not any(word in text_lower for word in ['?', 'explain', 'describe', 'discuss']):
        # If it ends with period and doesn't have question words, might be statement
        return False

    return True


#for debuging
def printQuestions():
    """
    Prints all extracted questions with numbering.
    """
    print(f"\n{'='*60}")
    print(f"EXTRACTED QUESTIONS: {len(_questionsList)} found")
    print(f"{'='*60}")
    
    for i, question in enumerate(_questionsList, 1):
        print(f"Question {i}:")
        print("-" * 40)
        # Show first 200 characters to avoid too much output
        preview = question[:200] + "..." if len(question) > 200 else question
        print(preview)
        # print(f"Length: {len(question)} characters")
    
    print(f"\n{'='*60}")
    print(f"Total questions extracted: {len(_questionsList)}")
    print(f"{'='*60}")
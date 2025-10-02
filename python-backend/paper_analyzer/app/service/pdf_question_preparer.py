import re
_questionsList = []

def get_clean_questions(pages):
    """
    Extract questions from pages and analyze them in chunks for core logic.
    """
    textGiven = normalizePdfQuestions(pages)

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
        r'Total\s*Marks?\s*:\s*\d+',  # Total Marks: 20
        re.IGNORECASE
    )

    # Page break pattern
    page_break_pattern = re.compile(r'-{2,}\s*Page\s*Break\s*-{2,}', re.IGNORECASE)

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
    Splits text into individual questions based on patterns.
    """
    global _questionsList
    _questionsList = []  # Reset before adding

    pattern = re.compile(r"""
        ^(?:
            Question\s+No\.?\d+  |  # "Question No.1"
            \d+\.\s+              |  # "1. "
            \(\d+\)\s+            |  # "(1) "
            [a-z]\)\s+            |  # "a) "
            [ivx]+\.\s+           |  # "i. ", "ii. "
            \d+\)\s+              |  # "1) "
            [A-Z]\.\s+            |  # "A. "
            Question\s*:?\s*      |  # "Question:"
            Q\.?\d+\.?            |  # "Q1", "Q.1"
            Part\s+[A-Z]          |  # "Part A"
            Section\s+[A-Z]         # "Section A"
        )
    """, re.MULTILINE | re.IGNORECASE | re.VERBOSE)

    matches = list(pattern.finditer(text))

    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        question_text = text[start:end].strip()
        _questionsList.append(question_text)

    # Print all extracted questions
    printQuestions()


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
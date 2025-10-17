from fastapi import UploadFile
from app.config.firebase_connection import FirebaseConnector
from app.model.firebase_db_model import get_questions_and_sources,get_all_questions_and_sources
from app.service.pdf_service import read_pdf_file
from rapidfuzz import process,fuzz
from collections import defaultdict
from typing import Optional

# Initialize Firestore client
connector = FirebaseConnector()
__db = connector.get_connection()


async def analyse_frequent_questions(subject: Optional[str] = None, file: Optional[UploadFile] = None):

    print("send to analysis")
    #subject & file was NOT provided
    if file is None and subject is None:
        data = get_all_questions_and_sources()
        results = analyse_all_subjects(data)

        print("analysis results \n\n")
        print(results)

        return results

    #subject is provided
    elif file is None:
        data = get_questions_and_sources(subject)

        results = analyse_signel_subject(data)

        print("analysis results \n\n")
        print_analysis(results)

        return results

    #all are provided
    else:
        print("all are given - these are the questions \n\n")
        new_questions = await read_pdf_file(file)
        existing_questions = get_questions_and_sources(subject)

        results = analyze_questions(new_questions,existing_questions)
        print(results)

        return dict(results)



from typing import List, Tuple
from collections import defaultdict
import difflib  # for approximate matching

def analyze_questions(new_questions: List[str], existing_questions: List[Tuple[str, str]], similarity_threshold: float = 0.9):
    """
    Compare new_questions with existing_questions and show duplicates.

    Args:
        new_questions: List of question strings to check.
        existing_questions: List of tuples (text, source_file).
        similarity_threshold: float between 0-1 for approximate matches. Default 0.9 (90% similarity)

    Returns:
        A dict containing repeated questions and their sources.
    """
    repeated = defaultdict(list)  # key: new_question, value: list of existing sources

    for nq in new_questions:
        nq_clean = nq.strip().lower()
        for eq_text, eq_source_file in existing_questions:
            eq_clean = eq_text.strip().lower()
            # Use difflib SequenceMatcher for approximate match
            similarity = difflib.SequenceMatcher(None, nq_clean, eq_clean).ratio()
            if similarity >= similarity_threshold:
                repeated[nq].append({
                    "existing_question": eq_text,
                    "source_file": eq_source_file,
                    "similarity": similarity
                })

    if repeated:
        print("Repeated questions found:\n")
        for new_q, matches in repeated.items():
            print(f"New Question: {new_q}")
            for m in matches:
                print(f"  -> Matches with: {m['existing_question']}")
                print(f"     Source File: {m['source_file']}, Similarity: {m['similarity']:.2f}")
            print("\n")
    else:
        print("No repeated questions found.")

    return repeated








def analyse_signel_subject(questions_and_sources, similarity_threshold=90):
    """
    Analyse frequently asked questions based on similarity.

    Parameters:
        questions_and_sources: list of tuples (text, source_file)
        similarity_threshold: 0-100, how close texts need to be to count as duplicate

    Returns:
        A list of dictionaries with question text, count, percentage, source files, and likelihood
    """
    # Extract all question texts
    texts = [q[0] for q in questions_and_sources]
    counted = []  # list of unique questions encountered
    results = defaultdict(lambda: {"count": 0, "source_files": set()})

    for text, source_file in questions_and_sources:
        match = None

        if counted:
            result = process.extractOne(
                query=text,
                choices=counted,
                scorer=fuzz.token_sort_ratio,
                score_cutoff=similarity_threshold
            )
            if result:
                match, score, idx = result

        if match:
            # Increment existing question
            results[match]["count"] += 1
            results[match]["source_files"].add(source_file)
        else:
            # New question
            counted.append(text)
            results[text]["count"] = 1
            results[text]["source_files"].add(source_file)

    # Convert counts to percentages and add likelihood
    total_questions = len(texts)
    analysis = []
    for q, info in results.items():
        count = info["count"]
        percent = round((count / total_questions) * 100, 2)
        likelihood = percent  # simple heuristic
        analysis.append({
            "question": q,
            "count": count,
            "percentage": percent,
            "source_files": list(info["source_files"]),
            "likelihood": likelihood
        })

    # Sort by frequency descending
    analysis.sort(key=lambda x: x["count"], reverse=True)
    return analysis

def analyse_all_subjects(content, similarity_threshold=90):
    """
    Analyse all subjects and group questions by subject with overall percentages.

    Parameters:
        content: list of tuples (text, source_file, subject)
        similarity_threshold: 0-100, how close texts need to be to count as duplicate

    Returns:
        Dictionary with subject analysis and overall percentages
    """
    # Group questions by subject
    subjects = {}
    for text, source_file, subject in content:
        if subject not in subjects:
            subjects[subject] = []
        subjects[subject].append((text, source_file))

    subject_analysis = {}
    total_questions = len(content)

    # Analyze each subject group
    for subject, questions in subjects.items():
        # Use the existing single subject analysis method
        subject_results = analyse_signel_subject(questions, similarity_threshold)

        # Calculate subject statistics
        subject_total = len(questions)
        subject_percentage = round((subject_total / total_questions) * 100, 2)

        # IMPROVED: Get top repeated questions
        # Filter for groups that have duplicates (count > 1) and sort by count descending
        duplicate_groups = [group for group in subject_results if group.get('count', 1) > 1]
        top_questions = sorted(duplicate_groups, key=lambda x: x.get('count', 0), reverse=True)[:5]

        # If no duplicates found, provide empty list
        if not top_questions:
            top_questions = []

        subject_analysis[subject] = {
            "total_questions": subject_total,
            "percentage": subject_percentage,
            "analysis": subject_results,
            "top_repeated_questions": top_questions
        }

    # Create overall summary
    overall_summary = {
        "total_subjects": len(subjects),
        "total_questions": total_questions,
        "subject_breakdown": {
            subject: {
                "count": data["total_questions"],
                "percentage": data["percentage"]
            } for subject, data in subject_analysis.items()
        },
        "detailed_analysis": subject_analysis
    }

    return overall_summary


def print_analysis(analysis, max_display=None):
    """
    Print analysis results in a readable format.

    Parameters:
        analysis: List of dictionaries from analyse() function
        max_display: Maximum number of results to display (None for all)
    """
    if not analysis:
        print("No analysis results to display.")
        return

    if max_display:
        display_data = analysis[:max_display]
    else:
        display_data = analysis

    total_questions = sum(item['count'] for item in analysis)

    print("=" * 80)
    print(f"FREQUENTLY ASKED QUESTIONS ANALYSIS")
    print(f"Total Questions: {total_questions} | Unique Questions: {len(analysis)}")
    print("=" * 80)
    print()

    for i, item in enumerate(display_data, 1):
        print(f"{i:2d}. {item['question']}")
        print(f" Count: {item['count']} ({item['percentage']}%)")
        print(f" Likelihood: {item['likelihood']}%")
        print(f" Sources: {', '.join(item['source_files'])}")
        print()

    if max_display and len(analysis) > max_display:
        print(f"... and {len(analysis) - max_display} more questions")
        print()

    # Summary
    print("-" * 80)
    print(f"Most frequent: '{analysis[0]['question']}' ({analysis[0]['count']} occurrences)")

    if len(analysis) > 1:
        top_3_percent = sum(item['percentage'] for item in analysis[:3])
        print(f"Top 3 questions account for {top_3_percent:.1f}% of all questions")

    multi_source = sum(1 for item in analysis if len(item['source_files']) > 1)
    if multi_source:
        print(f"{multi_source} questions appear in multiple sources")





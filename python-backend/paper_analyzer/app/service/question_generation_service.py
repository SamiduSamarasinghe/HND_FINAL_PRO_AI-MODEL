import os
from logging.config import valid_ident
from typing import List

import app.config.server_config as config
from ctransformers import AutoModelForCausalLM
from app.model.test_models import QuestionType
import re

class QuestionGenerationService:
    def __init__(self):
        base_dir = os.path.dirname(__file__)
        model_path = os.path.abspath(os.path.join(base_dir, "..", "..", "resources", "mistral-7b-instruct-v0.1.Q4_K_S.gguf"))

        if config.USE_CPU_FOR_AI:
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                model_type="mistral",
                local_files_only=True,
                context_length=2048
            )
        else:
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                model_type="mistral",
                gpu_layers=15,
                context_length=2048
            )

    def generate_questions_from_content(self, content: str, question_types: list, num_questions: int = 10, subject: str = "General"):
        """
        Generate new questions from lecture notes or past papers
        """
        try:
            # Limit content to avoid token limits
            content_sample = self._extract_key_content(content, max_chars=1000)
            print(f"📝 Extracted key content: '{content_sample}'")

            # Build prompt for question generation
            prompt = self._build_question_generation_prompt(content_sample, question_types, num_questions, subject)
            print(f"🤖 Generating questions with prompt length: {len(prompt)}")

            response = self.model(prompt, max_new_tokens=800)  # Reduced tokens
            print(f"🤖 AI response received: {len(response)} characters")
            print(f"🤖 AI response preview: {response[:200]}...")

            questions = self._parse_generated_questions(response, question_types, subject)
            #Filter out incomplete questions
            valid_questions = self._filter_incomplete_questions(questions)

            #If no valid MCQs but MCQ was requested, adjust question types
            if "MCQ" in question_types:
                mcq_count = len([q for q in valid_questions if q.get('type') == 'MCQ'])
                if mcq_count == 0:
                    print("⚠️ No valid MCQs generated, adjusting question types...")
                    #Remove MCQ from requested types for fallback
                    fallback_types = [qt for qt in question_types if qt != "MCQ"]
                    if fallback_types:
                        print(f"🔄 Using fallback types: {fallback_types}")
                        return self._generate_fallback_questions(content, fallback_types, num_questions, subject)


            return valid_questions

        except Exception as e:
            print(f"❌ Error in question generation: {e}")
            # Fallback: generate simple questions if AI fails
            return self._generate_fallback_questions(content, question_types, num_questions, subject)

    def _extract_key_content(self, content: str, max_chars: int = 1000) -> str:
        """
        Extract the most important content from lecturer notes
        """
        # Remove page headers, footers, and unwanted content
        lines = content.split('\n')
        filtered_lines = []

        #Filter out non-educational content
        for line in lines:
            line = line.strip()
            # Skip page headers/footers and very short lines
            if (len(line) > 15 and
                    not line.upper().startswith('POWERUP') and
                    not line.upper().startswith('NIBM') and
                    not line.startswith('===') and
                    '©' not in line and
                    not re.match(r'^[0-9\s]+$', line) and  # Skip lines with only numbers
                    not re.match(r'^[A-Z\s]{10,}$', line)  # Skip ALL CAPS headers
            ):

                filtered_lines.append(line)

        #Join and limit content
        key_content = ' '.join(filtered_lines)

        #If content is still too short, include more context
        if len(key_content) < 200:
            #Take first 500 chars as fallback
            key_content = content[:500]

        # Limit to max_chars while preserving sentences
        if len(key_content) > max_chars:
            # Try to cut at a sentence boundary
            last_period = key_content[:max_chars].rfind('.')
            if last_period > max_chars * 0.7:
                key_content = key_content[:last_period + 1]
            else:
                key_content = key_content[:max_chars] + "..."

        print(f"📝 Final key content: {len(key_content)} characters")
        return key_content

    def _build_question_generation_prompt(self, content: str, question_types: list, num_questions: int, subject: str) -> str:
        """
        Build an optimized prompt that stays within token limits
        """
        type_instructions = {
            "MCQ": "Create multiple-choice questions with 4 plausible options and indicate correct answer",
            "Short Answer": "Create short answer questions that test key concepts and definitions",
            "Essay": "Create essay questions that require critical thinking and analysis"
        }

        instructions = []
        for q_type in question_types:
            if q_type in type_instructions:
                instructions.append(f"- {type_instructions[q_type]}")

        # Calculate questions per type
        questions_per_type = max(1, num_questions // len(question_types))

        prompt = f"""IMPORTANT: Generate COMPLETE, READY-TO-USE questions. Follow these rules STRICTLY:
        
        CRITICAL RULES FOR MCQ:
        - Create EXACTLY 4 options for each MCQ
        - All options must be meaningful and plausible
        - NEVER leave options empty or use placeholders
        - Ensure question text is complete and clear
        
        CRITICAL RULES FOR ALL QUESTIONS:
        - NEVER use placeholder text like '[Question text]'
        - Ensure questions are fully formed and test-worthy
        - Make questions directly related to the content

        
        CONTENT:
        {content}
        
        INSTRUCTIONS:
        {chr(10).join(instructions)}
        - Focus on key concepts, definitions, and important facts from the content
        - Make questions clear, educational, and test-worthy
        - Vary the difficulty levels (basic recall to analytical thinking)
        - Ensure questions are directly related to the provided content
        
        FORMAT your response EXACTLY like this for each question:
        
        MCQ: [Complete question text]
        Options: A) [Option1] B) [Option2] C) [Option3] D) [Option4]
        Answer: [Correct letter A/B/C/D]
        
        SHORT_ANSWER: [Complete question text]
        Answer: [Expected answer key points]
        
        ESSAY: [Question text]
        Points: [Suggested points]
        
        Generate {questions_per_type} questions of each requested type now:"""

        return prompt

    def _generate_fallback_questions(self, content: str, question_types: list, num_questions: int, subject: str):
        """
        Generate simple fallback questions if AI fails
        """
        print("🔄 Using fallback question generation for lecture notes")

        # Extract key topics from content
        topics = self._extract_topics(content)
        questions = []

        questions_per_type = max(1, num_questions // len(question_types))

        for q_type in question_types:
            for i in range(questions_per_type):
                topic = topics[i % len(topics)] if topics else subject

                if q_type == "MCQ":
                    questions.append({
                        "text": f"What is a key characteristic of {topic} in {subject}?",
                        "type": "MCQ",
                        "options": [
                            f"Primary feature and main purpose of {topic}",
                            f"Common misconception about {topic} implementation",
                            f"Related but fundamentally different concept from {topic}",
                            f"Historical development context of {topic}"
                        ],
                        "correct_answer": "A",
                        "topic": topic,
                        "source": "ai_generated_fallback",
                        "points": 2
                    })
                elif q_type == "Short Answer":
                    questions.append({
                        "text": f"Explain the importance of {topic} in {subject}.",
                        "type": "Short Answer",
                        "correct_answer": f"Key points about {topic} importance would be explained here",
                        "topic": topic,
                        "source": "ai_generated_fallback",
                        "points": 5
                    })
                elif q_type == "Essay":
                    questions.append({
                        "text": f"Discuss the role and applications of {topic} in modern {subject}.",
                        "type": "Essay",
                        "correct_answer": f"Comprehensive analysis of {topic} applications",
                        "topic": topic,
                        "source": "ai_generated_fallback",
                        "points": 10
                    })
        #Exact requested numbers
        return questions[:num_questions]

    def generate_questions_from_lecture_notes(self, content: str, question_types: list, num_questions: int = 6,
                                              subject: str = "General"):
        """
        Generate questions from lecture notes using chunking and multiple AI calls
        """
        try:
            print("Using chunked processing for lecture notes")

            #Extract content chunks instead of single summary
            chunks = self._extract_content_chunks(content, max_chunks=5)
            print(f"Extracted {len(chunks)} content chunks")

            all_questions = []
            questions_per_chunk = max(1, num_questions // len(chunks))

            #Process each chunk with separate AI call
            for i, chunk in enumerate(chunks):
                print(f"Processing chunk {i+1}/{len(chunks)}: {len(chunk)} chars")

                chunk_questions = self._generate_questions_from_chunk(
                    chunk, question_types, questions_per_chunk, subject, f"Chunk_{i+1}"
                )
                all_questions.extend(chunk_questions)

                #Stop if we have enough questions
                if len(all_questions) >= num_questions:
                    break

            #Ensure we have at least 2 of each type
            final_questions = self._balance_question_types(all_questions, question_types, num_questions)

            print(f"Generated {len(final_questions)} questions from {len(chunks)} chunks")
            return final_questions

        except Exception as e:
            print(f"❌ Chunked processing failed: {e}")
            return self._generate_fallback_questions(content, question_types, num_questions, subject)

    def _extract_content_chunks(self, content: str, max_chunks: int = 5) -> List[str]:
        """
        Extract meaningful chunks from lecture notes content
        """
        chunks = []

        # Split by major sections (headings, page breaks, etc.)
        sections = re.split(r'\n--- Page Break ---\n|\n# |\n## |\n• |\n- ', content)

        for section in sections:
            section = section.strip()
            if len(section) < 50:  # Too short
                continue

            # Clean the section
            lines = section.split('\n')
            cleaned_lines = []

            for line in lines:
                line = line.strip()
                # Keep educational content, remove headers/footers
                if (len(line) > 10 and
                        not line.upper().startswith('POWERUP') and
                        not line.upper().startswith('NIBM') and
                        '©' not in line and
                        not re.match(r'^Page\s+\d+', line) and
                        not re.match(r'^\d+$', line)):
                    cleaned_lines.append(line)

            if cleaned_lines:
                chunk = ' '.join(cleaned_lines[:10])  # First 10 lines max
                if len(chunk) > 100:  # Meaningful chunk size
                    chunks.append(chunk)

        # Limit chunks and ensure minimum size
        selected_chunks = []
        for chunk in chunks[:max_chunks]:
            if len(chunk) > 150:
                selected_chunks.append(chunk[:800])  # Limit chunk size

        # If no good chunks found, create from sentences
        if not selected_chunks:
            sentences = re.split(r'[.!?]+', content)
            meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
            if meaningful_sentences:
                chunk = ' '.join(meaningful_sentences[:8])
                selected_chunks.append(chunk[:1000])

        return selected_chunks if selected_chunks else [content[:1000]]

    def _generate_questions_from_chunk(self, chunk: str, question_types: list, num_questions: int, subject: str, chunk_id: str):
        """
        Generate questions from a single content chunk
        """
        try:
            # Simple, focused prompt for each chunk
            prompt = f"""Based on this educational content about {subject}, create {num_questions} test questions:
    
            CONTENT: {chunk}
            
            Create questions that:
            - Test understanding of key concepts
            - Are clear and educational
            - Cover different difficulty levels
            
            Format each as:
            MCQ: [Question]  
            Options: A) [A] B) [B] C) [C] D) [D]
            Answer: [Letter]
            
            SHORT_ANSWER: [Question]
            Answer: [Key points]
            
            ESSAY: [Question]  
            Points: [10]
            
            Create questions now:"""

            print(f"Generating from chunk {chunk_id} ({len(chunk)} chars)")
            response = self.model(prompt, max_new_tokens=400, temperature=0.7)

            if response and len(response.strip()) > 50:
                questions = self._parse_generated_questions(response, question_types, subject)
                print(f"Chunk {chunk_id}: Generated {len(questions)} questions")
                return questions
            else:
                print(f"Chunk {chunk_id}: AI returned empty response")
                return []

        except Exception as e:
            print(f"Chunk {chunk_id} processing error: {e}")
            return []

    def _balance_question_types(self, questions: list, question_types: list, target_count: int):
        """
        Ensure we have balanced question types
        """
        if not questions:
            return self._generate_fallback_questions("", question_types, target_count, "General")

        # Count questions by type
        type_counts = {q_type: 0 for q_type in question_types}
        for q in questions:
            if q['type'] in type_counts:
                type_counts[q['type']] += 1

        print(f"Question distribution: {type_counts}")

        # If we don't have enough questions, generate more
        if len(questions) < target_count:
            needed = target_count - len(questions)
            additional = self._generate_fallback_questions("", question_types, needed, "General")
            questions.extend(additional)

        return questions[:target_count]

    def _extract_topics(self, content: str) -> list:
        """Extract key topics from content for fallback questions"""
        topics = []
        # General educational keywords that work for any subject
        keywords = [
            "definition", "purpose", "importance", "advantages", "disadvantages",
            "process", "method", "technique", "application", "implementation",
            "analysis", "evaluation", "comparison", "characteristics", "features"
        ]

        content_lower = content.lower()

        # Extract sentences that might contain topics
        sentences = content.split('.')
        for sentence in sentences:
            if len(sentence.strip()) > 20:  # Reasonable sentence length
                # Take first few words as topic
                words = sentence.strip().split()[:4]
                if words:
                    topic = ' '.join(words)
                    if len(topic) > 5:  # Meaningful topic length
                        topics.append(topic)

        # If no topics found, use general ones
        return topics[:3] if topics else ["Key Concepts", "Fundamental Principles", "Core Components"]

    def _parse_generated_questions(self, response: str, question_types: list, subject: str):
        """
        Parse the AI response into structured questions
        """
        structured_questions = []

        if not response or len(response.strip()) < 50:
            print("AI response too short or empty")
            return []

        print(f"Parsing AI response: {response[:200]}...")

        lines = response.strip().split('\n')
        i = 0

        while i < len(lines):
            line = lines[i].strip()

            # Parse MCQ questions
            if line.startswith('MCQ:') and 'MCQ' in question_types:
                try:
                    question_text = line[4:].strip()
                    i += 1

                    # Look for options
                    options = ["Option A", "Option B", "Option C", "Option D"]
                    correct_answer = "A"

                    while i < len(lines) and lines[i].strip().startswith('Options:'):
                        options_line = lines[i].strip()[8:].strip()
                        # Parse options like "A) Option1 B) Option2 C) Option3 D) Option4"
                        option_matches = re.findall(r'([A-D])\)\s*([^A-D)]+)', options_line)
                        if option_matches:
                            options = [f"{text.strip()}" for _, text in option_matches]
                        i += 1

                    # Look for answer
                    while i < len(lines) and lines[i].strip().startswith('Answer:'):
                        answer_line = lines[i].strip()[7:].strip()
                        if answer_line and answer_line in ['A', 'B', 'C', 'D']:
                            correct_answer = answer_line
                        i += 1
                        break

                    if question_text and len(question_text) > 10:
                        structured_questions.append({
                            "text": question_text,
                            "type": "MCQ",
                            "options": options,
                            "correct_answer": correct_answer,
                            "source": "ai_generated",
                            "points": 2
                        })
                        print(f"✅ Parsed MCQ: {question_text[:50]}...")
                except Exception as e:
                    print(f"❌ Error parsing MCQ: {e}")
                    i += 1

            # Parse short answer questions
            elif line.startswith('SHORT_ANSWER:') and 'Short Answer' in question_types:
                try:
                    question_text = line[13:].strip()
                    i += 1

                    correct_answer = "Key concepts from the content"
                    while i < len(lines) and lines[i].strip().startswith('Answer:'):
                        correct_answer = lines[i].strip()[7:].strip()
                        i += 1
                        break

                    if question_text and len(question_text) > 10:
                        structured_questions.append({
                            "text": question_text,
                            "type": "Short Answer",
                            "correct_answer": correct_answer,
                            "source": "ai_generated",
                            "points": 5
                        })
                        print(f"✅ Parsed Short Answer: {question_text[:50]}...")
                except Exception as e:
                    print(f"❌ Error parsing Short Answer: {e}")
                    i += 1

            # Parse essay questions
            elif line.startswith('ESSAY:') and 'Essay' in question_types:
                try:
                    question_text = line[6:].strip()
                    points = 10
                    i += 1

                    while i < len(lines) and lines[i].strip().startswith('Points:'):
                        try:
                            points = int(lines[i].strip()[7:].strip())
                        except ValueError:
                            pass
                        i += 1
                        break

                    if question_text and len(question_text) > 10:
                        structured_questions.append({
                            "text": question_text,
                            "type": "Essay",
                            "source": "ai_generated",
                            "points": points
                        })
                        print(f"✅ Parsed Essay: {question_text[:50]}...")
                except Exception as e:
                    print(f"❌ Error parsing Essay: {e}")
                    i += 1
            else:
                i += 1

        print(f"📊 Successfully parsed {len(structured_questions)} questions from AI response")
        return structured_questions

    def enhance_existing_questions(self, existing_questions: list, content: str):
        """
        Create variations of existing questions to avoid repetition
        """
        enhanced_questions = []

        for question in existing_questions[:5]:  # Limit to avoid too many tokens
            prompt = f"""
            Based on this educational content and the following question, create 2 different questions
            that test the same concept but are phrased differently and test different aspects.

            CONTENT:
            {content[:1000]}

            ORIGINAL QUESTION:
            {question['text']}

            Create 2 new questions that:
            1. Test the same core concept but with different phrasing
            2. Use different scenarios or examples
            3. Test different cognitive levels (application, analysis vs recall)
            4. Are completely original and not similar to the original

            Format each question as:
            NEW_QUESTION: [Question text]
            TYPE: [MCQ/SHORT_ANSWER/ESSAY]
            """

            try:
                response = self.model(prompt, max_new_tokens=500)
                new_questions = self._parse_enhancement_response(response, question['type'])
                enhanced_questions.extend(new_questions)

            except Exception as e:
                print(f"Error enhancing question: {e}")
                continue

        return enhanced_questions

    def _parse_enhancement_response(self, response: str, original_type: str):
        """
        Parse enhancement response
        """
        questions = []
        lines = response.strip().split('\n')

        for i, line in enumerate(lines):
            if line.startswith('NEW_QUESTION:'):
                question_text = line[13:].strip()

                if i + 1 < len(lines) and lines[i + 1].startswith('TYPE:'):
                    q_type = lines[i + 1][5:].strip()
                else:
                    q_type = original_type

                questions.append({
                    "text": question_text,
                    "type": q_type,
                    "topic": "AI Enhanced",
                    "points": 2 if q_type == "MCQ" else 5 if q_type == "Short Answer" else 10
                })

        return questions

    def extract_lecture_key_points(text: str) -> List[str]:
        """
        Extract key points from lecture notes for question generation
        """
        key_points = []

        # Split into sentences
        sentences = re.split(r'[.!?]+', text)

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20 or len(sentence) > 300:
                continue

            # Look for definition patterns
            if re.match(r'.*\b(is|are|means|refers to|defined as)\b', sentence, re.IGNORECASE):
                key_points.append(sentence)
            # Look for important statements
            elif re.match(r'.*\b(important|key|essential|crucial|significance|advantage|disadvantage)\b', sentence, re.IGNORECASE):
                key_points.append(sentence)
            # Look for list items and bullet points
            elif re.match(r'^[•\-*]\s+', sentence) or re.match(r'^\d+\.\s+', sentence):
                key_points.append(sentence)

        return key_points[:10]  # Return top 10 key points

    def _validate_mcq_question(self, question_data: dict) -> bool:
        """Validate MCQ question has complete options"""
        if question_data.get('type') != 'MCQ':
            return True

        options = question_data.get('options', [])

        #Must have exactly 4 options
        if len(options) != 4:
            print(f"MCQ validation failed: Expected 4 options, got {len(options)}")
            return False

        #All options must have meaningful content
        for i, option in enumerate(options):
            if not option or len(option.strip()) < 2 or option.strip() in ['', 'Option A', 'Option B', 'Option C', 'Option D']:
                print(f"MCQ validation failed: Option {i} is invalid: '{option}'")
                return False

        # Question text must be complete
        question_text = question_data.get('text', '')
        if not question_text or '[Question text]' in question_text or len(question_text.strip()) < 10:
            print(f"MCQ validation failed: Invalid question text: '{question_text}'")
            return False

        return True

    def _filter_incomplete_questions(self, questions: list) -> list:
        """Remove incomplete questions from the list"""
        valid_questions = []
        for q in questions:
            if q.get('type') == 'MCQ':
                if self._validate_mcq_question(q):
                    valid_questions.append(q)
                else:
                    print(f"Filtered out incomplete MCQ: {q.get('text', '')[:50]}...")
            else:
                #For non-MCQ, basic validation
                if q.get('text') and len(q.get('text', '').strip()) > 10:
                    valid_questions.append(q)

        print(f"Question filtering: {len(questions)} → {len(valid_questions)} valid questions")
        return valid_questions
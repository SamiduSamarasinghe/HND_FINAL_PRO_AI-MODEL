from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
from typing import List
from app.model.test_models import GeneratedTest, Question
import os
from datetime import datetime
from io import BytesIO

class PDFExportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom styles for the PDF"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))

        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=colors.gray
        ))

        # Question style
        self.styles.add(ParagraphStyle(
            name='CustomQuestion',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            leftIndent=0,
            textColor=colors.black
        ))

        # Question number style
        self.styles.add(ParagraphStyle(
            name='CustomQuestionNumber',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        ))

        #Metadata style
        self.styles.add(ParagraphStyle(
            name='QuestionMeta',
            parent=self.styles['Italic'],
            fontSize=9,
            spaceAfter=12,
            leftIndent=0,
            textColor=colors.gray
        ))

    def generate_test_pdf(self, test: GeneratedTest) -> bytes:
        """
        Generate PDF bytes for a test
        """
        try:
            # Create PDF in memory
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )

            story = []

            # Add title
            title = Paragraph(test.title, self.styles['CustomTitle'])
            story.append(title)

            # Add test information
            info_text = f"""
            <b>Subject:</b> {test.subject.replace('-', ' ').title()} | 
            <b>Total Questions:</b> {test.total_questions} | 
            <b>Total Points:</b> {test.total_points}
            """
            info = Paragraph(info_text, self.styles['CustomSubtitle'])
            story.append(info)

            # Add instructions
            instructions = Paragraph(
                "<b>Instructions:</b> Answer all questions in the space provided. Show all your work where necessary.",
                self.styles['CustomQuestion']
            )
            story.append(instructions)
            story.append(Spacer(1, 15))

            # Add questions
            for i, question in enumerate(test.questions, 1):
                story.extend(self._create_question_section(i, question))

                # Add space for answers based on question type
                if question.type == "MCQ":
                    story.extend(self._create_mcq_answer_space())
                elif question.type == "Short Answer":
                    story.extend(self._create_short_answer_space())
                else:  # Essay
                    story.extend(self._create_essay_answer_space())

                story.append(Spacer(1, 10))

            # Build PDF
            doc.build(story)
            pdf_bytes = buffer.getvalue()
            buffer.close()

            return pdf_bytes

        except Exception as e:
            print(f"PDF generation error: {str(e)}")
            raise

    def _create_question_section(self, number: int, question: Question) -> List:
        """Create question section with number and text"""
        elements = []

        #Get correct points based on question type
        points = self._get_correct_points(question.type)

        # Question number and text
        question_text = f"<b>Question {number}:</b> {question.text}"
        question_para = Paragraph(question_text, self.styles['CustomQuestion'])
        elements.append(question_para)

        # Question metadata
        meta_text = f"<i>Type: {question.type} | Points: {points}</i>"
        meta_para = Paragraph(meta_text, self.styles['QuestionMeta'])
        elements.append(meta_para)

        # Add MCQ options if applicable
        if question.type == "MCQ" and question.options:
            elements.extend(self._create_mcq_options(question.options))

        return elements

    def _get_correct_points(self, question_type: str) -> int:
        """Return correct points based on question type"""
        points_map = {
            "MCQ": 2,
            "Short Answer": 5,
            "Essay": 10
        }
        return points_map.get(question_type, 2)

    def _get_create_points(selfself, question_type: str) -> int:
        """Return correct points based on question type"""
        points_map = {
            "MCQ": 2,
            "Short Answer": 5,
            "Essay": 10
        }
        return points_map.get(question_type, 2)

    def _create_mcq_options(self, options: List[str]) -> List:
        """Create MCQ options table"""
        elements = []

        option_data = []
        for i, option in enumerate(options):
            option_data.append([f"({chr(65 + i)})", option])  # A), B), etc.

        option_table = Table(option_data, colWidths=[0.5*inch, 4*inch])
        option_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))

        elements.append(option_table)
        elements.append(Spacer(1, 8))
        return elements

    def _create_mcq_answer_space(self) -> List:
        """Create space for MCQ answer"""
        elements = []
        answer_text = Paragraph("<b>Your Answer:</b> _________________________", self.styles['CustomQuestion'])
        elements.append(answer_text)
        return elements

    def _create_short_answer_space(self) -> List:
        """Create space for short answer"""
        elements = []
        elements.append(Paragraph("<b>Your Answer:</b>", self.styles['CustomQuestion']))
        elements.append(Spacer(1, 0.05*inch))
        # Add some lines for writing
        for _ in range(2):
            elements.append(Paragraph("_" * 80, self.styles['CustomQuestion']))
            elements.append(Spacer(1, 0.05*inch))
        return elements

    def _create_essay_answer_space(self) -> List:
        """Create space for essay answer"""
        elements = []
        elements.append(Paragraph("<b>Your Answer:</b>", self.styles['CustomQuestion']))
        elements.append(Spacer(1, 0.05*inch))
        # Add more lines for essay
        for _ in range(5):
            elements.append(Paragraph("_" * 80, self.styles['CustomQuestion']))
            elements.append(Spacer(1, 0.05*inch))
        return elements

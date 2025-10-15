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
        # Title style - using correct parent style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],  # ✅ FIXED: Use existing style
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))

        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],  # ✅ FIXED: Use existing style
            fontSize=12,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.gray
        ))

        # Question style
        self.styles.add(ParagraphStyle(
            name='CustomQuestion',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            leftIndent=20
        ))

        # Question number style
        self.styles.add(ParagraphStyle(
            name='CustomQuestionNumber',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
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
            <b>Difficulty:</b> {test.difficulty} | 
            <b>Total Questions:</b> {test.total_questions} | 
            <b>Total Points:</b> {test.total_points}
            """
            info = Paragraph(info_text, self.styles['CustomSubtitle'])
            story.append(info)

            # Add instructions
            instructions = Paragraph(
                "<b>Instructions:</b> Answer all questions in the space provided. Show all your work where necessary.",
                self.styles['Normal']
            )
            story.append(instructions)
            story.append(Spacer(1, 20))

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

                story.append(Spacer(1, 15))

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

        # Question number and text
        question_text = f"<b>Question {number}:</b> {question.text}"
        question_para = Paragraph(question_text, self.styles['CustomQuestion'])
        elements.append(question_para)

        # Question metadata
        meta_text = f"<i>Type: {question.type} | Points: {question.points} | Difficulty: {question.difficulty}</i>"
        meta_para = Paragraph(meta_text, self.styles['Italic'])
        elements.append(meta_para)

        # Add MCQ options if applicable
        if question.type == "MCQ" and question.options:
            elements.extend(self._create_mcq_options(question.options))

        elements.append(Spacer(1, 10))
        return elements

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
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))

        elements.append(option_table)
        return elements

    def _create_mcq_answer_space(self) -> List:
        """Create space for MCQ answer"""
        elements = []
        answer_text = Paragraph("<b>Your Answer:</b> _________________________", self.styles['Normal'])
        elements.append(answer_text)
        elements.append(Spacer(1, 15))
        return elements

    def _create_short_answer_space(self) -> List:
        """Create space for short answer"""
        elements = []
        elements.append(Paragraph("<b>Your Answer:</b>", self.styles['Normal']))
        elements.append(Spacer(1, 0.1*inch))
        # Add some lines for writing
        for _ in range(3):
            elements.append(Paragraph("_" * 100, self.styles['Normal']))
            elements.append(Spacer(1, 0.05*inch))
        return elements

    def _create_essay_answer_space(self) -> List:
        """Create space for essay answer"""
        elements = []
        elements.append(Paragraph("<b>Your Answer:</b>", self.styles['Normal']))
        elements.append(Spacer(1, 0.1*inch))
        # Add more lines for essay
        for _ in range(15):
            elements.append(Paragraph("_" * 100, self.styles['Normal']))
            elements.append(Spacer(1, 0.05*inch))
        return elements
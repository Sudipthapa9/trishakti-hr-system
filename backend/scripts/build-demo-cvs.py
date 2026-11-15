"""Generate labelled, fictional one-page PDFs from seed-demo-data's manifest.

Requires reportlab. No external services or applicant data are used.
"""
from pathlib import Path
import json
import sys
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph
from xml.sax.saxutils import escape

manifest_path = Path(sys.argv[1]).resolve()
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="DemoName", fontName="Helvetica-Bold", fontSize=22, leading=27, spaceAfter=12, textColor=colors.HexColor("#13334c")))
styles.add(ParagraphStyle(name="DemoWarning", fontName="Helvetica-Bold", fontSize=10, leading=15, textColor=colors.HexColor("#9b2c2c"), spaceAfter=16))
styles["BodyText"].fontName = "Helvetica"
styles["BodyText"].fontSize = 10
styles["BodyText"].leading = 15
styles["BodyText"].spaceAfter = 10
styles["Heading2"].fontName = "Helvetica-Bold"
styles["Heading2"].fontSize = 12
styles["Heading2"].leading = 17
styles["Heading2"].spaceBefore = 13
styles["Heading2"].spaceAfter = 7

for person in manifest["candidates"]:
    output = manifest_path.parent / person["cvName"]
    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=46, bottomMargin=44, title="Demo CV - " + person["fullName"], author="Trishakti demo data")
    parts = [Paragraph(escape(person["fullName"]), styles["DemoName"]),
             Paragraph("DEMO CV - FICTIONAL PERSON - FOR INTERFACE PRACTICE ONLY", styles["DemoWarning"]),
             Paragraph(escape(person["profile"] + " | " + person["email"] + " | " + person["phone"]), styles["BodyText"])]
    sections = [
        ("Profile", f"Fictional applicant exploring a {person['profile']} position. This synthetic profile contains no real employment, education or contact details. It is supplied only to exercise application review and private CV downloads."),
        ("Skills", ", ".join(person["skills"])),
        ("Demonstration experience", f"{person['experienceYears']} years of simulated experience. Demo Practice Workshop - training projects only. Supported sample tasks, prepared fictional reports and collaborated on illustrative team exercises. No real employer or work history is claimed."),
        ("Example project", "Prepared a small practice portfolio covering " + ", ".join(person["skills"][:3]).lower() + ". Materials are synthetic and do not contain customer, employer or applicant information."),
        ("Education", "Demo Training Programme - fictional coursework for a sample CV. No real degree, certification or institution is represented."),
        ("Usage note", "Do not contact this person or use this profile for a real hiring decision. The .invalid email domain and reserved fictional phone number are intentional. This CV does not represent a screening score or verified qualification."),
    ]
    for heading, text in sections:
        parts.extend([Paragraph(heading, styles["Heading2"]), Paragraph(escape(text), styles["BodyText"])])
    doc.build(parts)
print("Generated", len(manifest["candidates"]), "fictional PDF CVs.")

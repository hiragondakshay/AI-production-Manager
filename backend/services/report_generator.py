import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from sqlalchemy.orm import Session
from models import Machine, Order, ProductionLog, Alert

def generate_shift_pdf_report(db: Session) -> bytes:
    """
    Generates a formal executive PDF Shift Summary & OEE Report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0284c7'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=8
    )

    story = []

    # Title & Header
    story.append(Paragraph("NEXUSPROD AI - EXECUTIVE SHIFT & OEE REPORT", title_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y - %H:%M:%S UTC')} | Plant ID: FAC-NORTH-01", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceAfter=15))

    # Fetch Metrics
    machines = db.query(Machine).all()
    orders = db.query(Order).all()
    logs = db.query(ProductionLog).all()

    total_output = sum(l.units_produced for l in logs) if logs else 0
    total_defects = sum(l.defective_units for l in logs) if logs else 0
    total_downtime = sum(l.downtime_minutes for l in logs) if logs else 0.0

    running_count = len([m for m in machines if m.status == 'running'])
    uptime_pct = round((running_count / max(1, len(machines))) * 100, 1)

    # Executive Summary Table Cards
    summary_data = [
        ["TOTAL OUTPUT", "FLEET UPTIME", "TOTAL DEFECTS", "PLANT DOWNTIME"],
        [f"{total_output:,} pcs", f"{uptime_pct}%", f"{total_defects:,} pcs", f"{total_downtime:.0f} mins"]
    ]
    summary_table = Table(summary_data, colWidths=[130, 130, 130, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#94a3b8')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,1), (-1,1), colors.HexColor('#0284c7')),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 13),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # Machine Telemetry Table Section
    story.append(Paragraph("Machine Fleet Telemetry & Health Audit", section_style))
    mach_data = [["Machine Name", "Model", "Status", "Health %", "Temp (°C)", "Vibration (mm/s)"]]
    for m in machines:
        mach_data.append([
            m.name,
            m.model_code,
            m.status.upper(),
            f"{m.health_score}%",
            f"{m.temperature}°C",
            f"{m.vibration} mm/s"
        ])

    mach_table = Table(mach_data, colWidths=[150, 80, 80, 70, 70, 90])
    mach_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(mach_table)
    story.append(Spacer(1, 15))

    # Signature Block
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=15))
    sig_data = [
        ["Plant Operations Manager", "Quality Control Supervisor"],
        ["___________________________", "___________________________"],
        ["Signature & Date", "Signature & Date"]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#64748b'))
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

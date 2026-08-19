import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
from reportlab.lib.units import inch

def generate_invoice_pdf(invoice_data: dict, company_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette - Auralix Brand: Primary Black (#0F172A), Accent Orange (#F97316), Soft Grey (#F1F5F9)
    brand_dark = colors.HexColor("#0F172A")
    brand_orange = colors.HexColor("#EA580C")
    brand_accent = colors.HexColor("#F97316")
    text_dark = colors.HexColor("#1E293B")
    text_muted = colors.HexColor("#64748B")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=brand_dark
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=brand_orange
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=brand_dark
    )

    normal_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )

    muted_style = ParagraphStyle(
        'BodyMuted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=text_muted
    )

    bold_style = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )

    story = []

    # --- Header Table (Logo / Brand on left, Invoice # on right) ---
    company_name = company_data.get("name", "Auralix Technologies")
    company_tag = "Revenue & Business Management System"
    company_info = f"{company_data.get('address', '')}<br/>Email: {company_data.get('email', '')} | Phone: {company_data.get('phone', '')}<br/>GSTIN: {company_data.get('gstin', '')}"

    header_left = [
        Paragraph(f"<b>{company_name}</b>", title_style),
        Paragraph(company_tag, subtitle_style),
        Spacer(1, 4),
        Paragraph(company_info, muted_style)
    ]

    inv_num = invoice_data.get("invoice_number", "INV-2026-0001")
    inv_date = invoice_data.get("issue_date", "")
    due_date = invoice_data.get("due_date", "")
    inv_status = invoice_data.get("status", "Pending").upper()

    header_right = [
        Paragraph(f"<font color='#EA580C'><b>TAX INVOICE</b></font>", ParagraphStyle('TaxInv', parent=title_style, fontSize=20, alignment=2)),
        Paragraph(f"<b>Invoice #:</b> {inv_num}", ParagraphStyle('InvNum', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Date:</b> {inv_date}", ParagraphStyle('InvDate', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Due Date:</b> {due_date}", ParagraphStyle('DueDate', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Status:</b> <font color='#EA580C'><b>{inv_status}</b></font>", ParagraphStyle('Status', parent=normal_style, alignment=2))
    ]

    header_table = Table([[header_left, header_right]], colWidths=[300, 220])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_orange, spaceBefore=0, spaceAfter=15))

    # --- Bill To & Details ---
    client_name = invoice_data.get("client_name", "Client")
    client_company = invoice_data.get("client_company", "Company")
    client_email = invoice_data.get("client_email", "")
    client_phone = invoice_data.get("client_phone", "")
    client_address = invoice_data.get("client_address", "")
    client_gstin = invoice_data.get("client_gstin", "")

    client_details_str = f"<b>{client_name}</b>"
    if client_company:
        client_details_str += f"<br/><b>{client_company}</b>"
    if client_address:
        client_details_str += f"<br/>{client_address}"
    if client_email or client_phone:
        client_details_str += f"<br/>Email: {client_email} | Phone: {client_phone}"
    if client_gstin:
        client_details_str += f"<br/>GSTIN: {client_gstin}"

    bill_to_content = [
        Paragraph("<b>BILLED TO:</b>", heading_style),
        Paragraph(client_details_str, normal_style),
    ]

    payment_info_content = [
        Paragraph("<b>PAYMENT METHOD:</b>", heading_style),
        Paragraph("Bank Transfer / UPI / Card", normal_style),
        Paragraph("<b>Auralix Technologies Business Account</b>", muted_style)
    ]

    details_table = Table([[bill_to_content, payment_info_content]], colWidths=[280, 240])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 20))

    # --- Itemized Table ---
    table_data = [
        [
            Paragraph("<b>#</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white)),
            Paragraph("<b>Item & Description</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white)),
            Paragraph("<b>Type</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white, alignment=1)),
            Paragraph("<b>Qty</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white, alignment=1)),
            Paragraph("<b>Rate (₹)</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white, alignment=2)),
            Paragraph("<b>Amount (₹)</b>", ParagraphStyle('TH', parent=bold_style, textColor=colors.white, alignment=2))
        ]
    ]

    items = invoice_data.get("items", [])
    required_sum = 0.0
    spent_sum = 0.0

    if not items:
        table_data.append([
            Paragraph("1", normal_style),
            Paragraph("Service Package Fee", normal_style),
            Paragraph("<font color='#059669'>Required</font>", ParagraphStyle('TC', parent=normal_style, alignment=1)),
            Paragraph("1", ParagraphStyle('TC', parent=normal_style, alignment=1)),
            Paragraph(f"₹{invoice_data.get('subtotal', 0.0):,.2f}", ParagraphStyle('TR', parent=normal_style, alignment=2)),
            Paragraph(f"₹{invoice_data.get('subtotal', 0.0):,.2f}", ParagraphStyle('TR', parent=normal_style, alignment=2))
        ])
        required_sum = invoice_data.get('subtotal', 0.0)
    else:
        for idx, item in enumerate(items, 1):
            itype = item.get("item_type", "required").lower()
            qty = float(item.get("quantity", 1))
            rate = float(item.get("unit_price", 0.0))
            tot = item.get("total", qty * rate)

            if itype == "spent":
                type_tag = "<font color='#DC2626'><b>Spent</b></font>"
                spent_sum += tot
            else:
                type_tag = "<font color='#059669'><b>Required</b></font>"
                required_sum += tot

            table_data.append([
                Paragraph(str(idx), normal_style),
                Paragraph(item.get("description", ""), normal_style),
                Paragraph(type_tag, ParagraphStyle('TC', parent=normal_style, alignment=1)),
                Paragraph(str(qty), ParagraphStyle('TC', parent=normal_style, alignment=1)),
                Paragraph(f"₹{rate:,.2f}", ParagraphStyle('TR', parent=normal_style, alignment=2)),
                Paragraph(f"₹{tot:,.2f}", ParagraphStyle('TR', parent=normal_style, alignment=2))
            ])

    item_table = Table(table_data, colWidths=[25, 230, 65, 45, 75, 80])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), brand_dark),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(item_table)
    story.append(Spacer(1, 15))

    # --- Financial Summary Table ---
    subtotal = invoice_data.get("subtotal", required_sum if required_sum > 0 else (required_sum + spent_sum))
    discount = invoice_data.get("discount_amount", 0.0)
    tax = invoice_data.get("tax_amount", 0.0)
    grand_total = invoice_data.get("grand_total", subtotal - discount + tax)
    paid = invoice_data.get("amount_paid", 0.0)
    balance = invoice_data.get("balance_due", grand_total - paid)

    summary_data = [
        [Paragraph("Required Billed Total:", bold_style), Paragraph(f"₹{required_sum:,.2f}", ParagraphStyle('SR', parent=normal_style, alignment=2))]
    ]
    if spent_sum > 0:
        summary_data.append([Paragraph("Spent Operational Costs:", muted_style), Paragraph(f"₹{spent_sum:,.2f}", ParagraphStyle('SR', parent=muted_style, alignment=2))])

    summary_data.extend([
        [Paragraph("Subtotal:", bold_style), Paragraph(f"₹{subtotal:,.2f}", ParagraphStyle('SR', parent=normal_style, alignment=2))],
        [Paragraph("Discount:", normal_style), Paragraph(f"- ₹{discount:,.2f}", ParagraphStyle('SR', parent=normal_style, alignment=2))],
        [Paragraph("GST / Tax:", normal_style), Paragraph(f"+ ₹{tax:,.2f}", ParagraphStyle('SR', parent=normal_style, alignment=2))],
        [Paragraph("<b>Grand Total:</b>", ParagraphStyle('GT', parent=heading_style, fontSize=11)), Paragraph(f"<b>₹{grand_total:,.2f}</b>", ParagraphStyle('SR', parent=heading_style, fontSize=11, textColor=brand_orange, alignment=2))],
        [Paragraph("Amount Paid:", normal_style), Paragraph(f"₹{paid:,.2f}", ParagraphStyle('SR', parent=normal_style, alignment=2))],
        [Paragraph("<b>Balance Due:</b>", ParagraphStyle('BD', parent=bold_style, textColor=brand_dark)), Paragraph(f"<b>₹{balance:,.2f}</b>", ParagraphStyle('SR', parent=bold_style, textColor=brand_dark, alignment=2))]
    ])

    summary_table = Table(summary_data, colWidths=[140, 90])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,-3), (1,-3), 1, brand_orange),
    ]))

    notes_terms_content = []
    if invoice_data.get("notes"):
        notes_terms_content.extend([
            Paragraph("<b>Notes / Description:</b>", heading_style),
            Paragraph(invoice_data.get("notes"), muted_style),
            Spacer(1, 8)
        ])
    notes_terms_content.extend([
        Paragraph("<b>Terms & Conditions:</b>", heading_style),
        Paragraph(invoice_data.get("terms", "Payment strictly within 15 business days."), muted_style)
    ])
    
    wrapper_table = Table([[notes_terms_content, summary_table]], colWidths=[280, 240])
    wrapper_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(wrapper_table)
    story.append(Spacer(1, 25))

    # --- Signature & Footer ---
    signatory_title = invoice_data.get("signatory_title", "Business Development Executive")
    sig_content = [
        Paragraph(f"<b>Authorized Signature</b>", ParagraphStyle('SigHead', parent=bold_style, alignment=2)),
        Paragraph(f"<font color='#EA580C'><b>{signatory_title}</b></font>", ParagraphStyle('SigTitle', parent=subtitle_style, fontSize=9, alignment=2)),
        Spacer(1, 20),
        Paragraph("<b>Auralix Technologies</b>", ParagraphStyle('SigCo', parent=bold_style, fontSize=9, alignment=2)),
        Paragraph("Digitally Verified Corporate Invoice", ParagraphStyle('SigSub', parent=muted_style, alignment=2))
    ]
    sig_table = Table([[Paragraph("", normal_style), sig_content]], colWidths=[300, 220])
    story.append(KeepTogether(sig_table))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_report_pdf(title: str, subtitle: str, summary_kpis: dict, data_rows: list, headers: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    brand_dark = colors.HexColor("#0F172A")
    brand_orange = colors.HexColor("#EA580C")
    text_dark = colors.HexColor("#1E293B")
    border_color = colors.HexColor("#E2E8F0")

    story = [
        Paragraph(f"<b>{title}</b>", ParagraphStyle('RTitle', parent=styles['Heading1'], fontSize=20, textColor=brand_dark)),
        Paragraph(f"<font color='#EA580C'><b>Auralix RevenueHub</b> — {subtitle}</font>", ParagraphStyle('RSub', parent=styles['Normal'], fontSize=10)),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=brand_orange, spaceBefore=0, spaceAfter=15)
    ]

    # Summary KPI row
    kpi_cells = []
    for k, v in summary_kpis.items():
        kpi_cells.append(Paragraph(f"<b>{k}</b><br/><font color='#EA580C' size=11><b>{v}</b></font>", ParagraphStyle('KPI', parent=styles['Normal'], alignment=1)))
    
    if kpi_cells:
        col_w = 520 / len(kpi_cells)
        kpi_table = Table([kpi_cells], colWidths=[col_w]*len(kpi_cells))
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 15))

    # Main data table
    table_header = [Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', textColor=colors.white)) for h in headers]
    table_matrix = [table_header]
    
    for row in data_rows:
        row_cells = [Paragraph(str(cell), ParagraphStyle('TD', parent=styles['Normal'], fontSize=8)) for cell in row]
        table_matrix.append(row_cells)

    if data_rows:
        num_cols = len(headers)
        col_width = 520 / num_cols
        data_table = Table(table_matrix, colWidths=[col_width]*num_cols)
        data_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), brand_dark),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")])
        ]))
        story.append(data_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

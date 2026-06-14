import datetime
from io import BytesIO
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from openpyxl import Workbook
import engine

def generate_scenario_pdf(scenario_data) -> BytesIO:
    """
    Generates a professional PDF report containing the scenario's variables and their calculated values.
    """
    buffer = BytesIO()
    # Setting tight margins for maximum data density and readability
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    # Define color scheme (Teal/Slate - Maestro UI compatible)
    primary_color = colors.HexColor('#0d9488')  # Teal-600
    text_color = colors.HexColor('#1e293b')     # Slate-800
    muted_color = colors.HexColor('#475569')    # Slate-600
    bg_light = colors.HexColor('#f8fafc')       # Slate-50

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=primary_color,
        spaceAfter=6
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontSize=9,
        textColor=muted_color,
        spaceAfter=15,
        leading=14
    )
    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=4,
        keepWithNext=True
    )
    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=8,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=7,
        leading=9,
        textColor=text_color
    )
    cell_mono_style = ParagraphStyle(
        'CellMono',
        parent=styles['Normal'],
        fontSize=7,
        fontName='Courier',
        leading=9,
        textColor=text_color
    )

    # Header section
    story.append(Paragraph("UISA - Memorial de Balanço de Massa e Energia", title_style))
    meta_text = (
        f"<b>Ano Safra:</b> {scenario_data.year_harvest} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Mês Referência:</b> {scenario_data.reference_month} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Versão:</b> v{scenario_data.version} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Status:</b> {scenario_data.status.value}<br/>"
        f"<b>Gerado em:</b> {datetime.datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S UTC')}"
    )
    story.append(Paragraph(meta_text, meta_style))

    # Calculate results to display the resolved numeric values
    calc_res = engine.calculate_state(scenario_data.variables)
    results = calc_res.get("results", {})

    # Group variables by Sector
    sectors: Dict[str, List[Dict[str, Any]]] = {}
    for var in scenario_data.variables:
        sec = var.get("SETOR", "Outros")
        if sec not in sectors:
            sectors[sec] = []
        sectors[sec].append(var)

    # Add sectors to document
    for sector_name, vars_list in sectors.items():
        # Clean sector name
        clean_name = sector_name.replace("INFORMAO CALCULOS", "Parâmetros de Processo").title()
        story.append(Paragraph(clean_name, h2_style))

        # Build table
        table_data = [[
            Paragraph("ID", header_cell_style),
            Paragraph("Descrição", header_cell_style),
            Paragraph("Tipo", header_cell_style),
            Paragraph("Unidade", header_cell_style),
            Paragraph("Valor Final", header_cell_style)
        ]]

        for v in vars_list:
            ref = v.get("ID - REF", "")
            desc = v.get("DESCRIÇÃO", "")
            v_type = v.get("TIPO", "")
            unit = v.get("UNIDADE DE MEDIDA", "")
            
            # Format evaluated value
            val = results.get(ref)
            if val is not None:
                if isinstance(val, (int, float)):
                    val_str = f"{val:,.4f}".replace(",", "X").replace(".", ",").replace("X", ".")
                else:
                    val_str = str(val)
            else:
                val_str = str(v.get("EQUAÇÕES E VALORES", "-"))

            table_data.append([
                Paragraph(ref, cell_mono_style),
                Paragraph(desc, cell_style),
                Paragraph(v_type, cell_style),
                Paragraph(unit, cell_style),
                Paragraph(val_str, cell_mono_style)
            ])

        # Table Column Widths: ID (45), Descrição (250), Tipo (40), Unidade (75), Valor (110)
        t = Table(table_data, colWidths=[45, 250, 40, 75, 110])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            ('TOPPADDING', (0, 0), (-1, 0), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
            ('TOPPADDING', (0, 1), (-1, -1), 3),
        ]))
        
        story.append(t)
        story.append(Spacer(1, 10))

    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_scenario_xlsx(scenario_data) -> BytesIO:
    """
    Generates a clean spreadsheet representing all scenario variables.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Balanço Massa e Energia"

    # Add metadata header block
    ws.append(["UISA - BALANÇO DE MASSA E ENERGIA"])
    ws.append([f"Ano Safra: {scenario_data.year_harvest}"])
    ws.append([f"Mês Referência: {scenario_data.reference_month}"])
    ws.append([f"Versão: v{scenario_data.version}"])
    ws.append([f"Status: {scenario_data.status.value}"])
    ws.append([f"Exportado em: {datetime.datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S UTC')}"])
    ws.append([])  # Spacer

    # Headers
    headers = ["ID", "Setor", "Definição", "Descrição", "Tipo", "Unidade", "Valor Final / Fórmula"]
    ws.append(headers)

    # Calculate values
    calc_res = engine.calculate_state(scenario_data.variables)
    results = calc_res.get("results", {})

    # Append records
    for v in scenario_data.variables:
        ref = v.get("ID - REF", "")
        sector = v.get("SETOR", "")
        definition = v.get("DEFINIÇÃO", "")
        description = v.get("DESCRIÇÃO", "")
        v_type = v.get("TIPO", "")
        unit = v.get("UNIDADE DE MEDIDA", "")
        
        # Prefer calculated result if output, otherwise show raw input
        val = results.get(ref)
        if val is None:
            val = v.get("EQUAÇÕES E VALORES", "")
            
        ws.append([ref, sector, definition, description, v_type, unit, val])

    # Auto-fit column widths
    for col in ws.columns:
        max_len = 0
        col_letter = col[0].column_letter
        for cell in col:
            # Skip title and metadata
            if cell.row < 8:
                continue
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = max(max_len + 3, 10)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer

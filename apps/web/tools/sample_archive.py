#!/usr/bin/env python3
"""Generate the source files for the playground's demo archive.

Usage: python3 sample_archive.py <staging-dir> <nested-src-dir>

Writes plain text, a minimal PDF and minimal OOXML (docx/xlsx/pptx) files into
the staging directory. The two files for the *nested* archive are written into a
separate directory so the shell wrapper can zip them without leaving loose
copies behind. The wrapper adds the video/image (via ffmpeg) and zips it all.
"""
import os
import sys
import zipfile

PKG_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_DOC_REL = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
)
XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'


def write(path: str, data: str | bytes) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if isinstance(data, (bytes, bytearray)):
        with open(path, "wb") as handle:
            handle.write(data)
    else:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(data)


def make_pdf() -> bytes:
    """A minimal, valid single-page PDF (no dependencies)."""
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 200] "
            b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
        ),
    ]
    stream = b"BT /F1 16 Tf 24 120 Td (Hello from inside the archive!) Tj ET\n"
    objects.append(
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"endstream"
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += str(index).encode() + b" 0 obj\n" + body + b"\nendobj\n"
    xref_pos = len(out)
    count = len(objects) + 1
    out += b"xref\n0 " + str(count).encode() + b"\n"
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += (f"{offset:010d} 00000 n \n").encode()
    out += b"trailer\n<< /Size " + str(count).encode() + b" /Root 1 0 R >>\n"
    out += b"startxref\n" + str(xref_pos).encode() + b"\n%%EOF\n"
    return bytes(out)


def make_ooxml(path: str, content_types: str, parts: dict[str, str]) -> None:
    rels = (
        f"{XML_DECL}<Relationships"
        f' xmlns="{REL_NS}">'
        f'<Relationship Id="rId1" Type="{OFFICE_DOC_REL}" Target="{parts["__target__"]}"/>'
        "</Relationships>"
    )
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", rels)
        for name, body in parts.items():
            if name == "__target__":
                continue
            archive.writestr(name, body)


def make_docx(path: str) -> None:
    content_types = (
        f"{XML_DECL}<Types xmlns=\"{PKG_NS}\">"
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    )
    document = (
        f"{XML_DECL}"
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        "<w:body>"
        "<w:p><w:r><w:t>Hello from inside the archive (DOCX).</w:t></w:r></w:p>"
        "<w:p><w:r><w:t>Word documents cannot be previewed inline from an archive — "
        "download to open.</w:t></w:r></w:p>"
        "<w:sectPr/></w:body></w:document>"
    )
    make_ooxml(
        path,
        content_types,
        {"__target__": "word/document.xml", "word/document.xml": document},
    )


def make_xlsx(path: str) -> None:
    content_types = (
        f"{XML_DECL}<Types xmlns=\"{PKG_NS}\">"
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        "</Types>"
    )
    workbook = (
        f"{XML_DECL}"
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Sales" sheetId="1" r:id="rId1"/></sheets></workbook>'
    )
    workbook_rels = (
        f"{XML_DECL}<Relationships xmlns=\"{REL_NS}\">"
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        'Target="worksheets/sheet1.xml"/></Relationships>'
    )
    sheet = (
        f"{XML_DECL}"
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        "<sheetData>"
        '<row r="1"><c r="A1" t="inlineStr"><is><t>Hello from the archive (XLSX)</t></is></c>'
        '<c r="B1" t="inlineStr"><is><t>42</t></is></c></row>'
        "</sheetData></worksheet>"
    )
    make_ooxml(
        path,
        content_types,
        {
            "__target__": "xl/workbook.xml",
            "xl/workbook.xml": workbook,
            "xl/_rels/workbook.xml.rels": workbook_rels,
            "xl/worksheets/sheet1.xml": sheet,
        },
    )


def make_pptx(path: str) -> None:
    content_types = (
        f"{XML_DECL}<Types xmlns=\"{PKG_NS}\">"
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
        '<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        "</Types>"
    )
    presentation = (
        f"{XML_DECL}"
        '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>'
    )
    presentation_rels = (
        f"{XML_DECL}<Relationships xmlns=\"{REL_NS}\">"
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" '
        'Target="slides/slide1.xml"/></Relationships>'
    )
    slide = (
        f"{XML_DECL}"
        '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        "<p:cSld><p:spTree>"
        "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>"
        "<p:grpSpPr/>"
        "</p:spTree></p:cSld></p:sld>"
    )
    make_ooxml(
        path,
        content_types,
        {
            "__target__": "ppt/presentation.xml",
            "ppt/presentation.xml": presentation,
            "ppt/_rels/presentation.xml.rels": presentation_rels,
            "ppt/slides/slide1.xml": slide,
        },
    )


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: sample_archive.py <staging-dir> <nested-src-dir>")
    staging = sys.argv[1]
    nested = sys.argv[2]

    write(
        os.path.join(staging, "docs", "welcome.md"),
        "# Welcome to the demo archive\n\n"
        "This file lives **inside** `archive-demo.zip`. Open it from the archive "
        "listing and the viewer renders it in place — no new page.\n\n"
        "- `docs/` — Markdown, PDF, DOCX and a plain-text note\n"
        "- `data/` — CSV, JSON and an XLSX workbook\n"
        "- `media/` — an MP4 clip, a PPTX deck, an SVG badge and a PNG image\n"
        "- `nested/bundle.zip` — another archive: click it to browse inside the "
        "*same* breadcrumb\n\n"
        "```ts\n"
        'import { mountViewer } from "@gntrees/docs-viewer";\n\n'
        'mountViewer("#app", { source: "/archive-demo.zip" });\n'
        "```\n",
    )
    write(
        os.path.join(staging, "docs", "notes.txt"),
        "Plain-text note\n================\n\n"
        "Archives hold all sorts of files. Anything the viewer can preview at a "
        "URL it can also preview straight out of an archive: the member is "
        "extracted, handed a blob: URL and detected by its name.\n",
    )
    write(
        os.path.join(staging, "data", "sales.csv"),
        "region,quarter,units,revenue,rating\n"
        "North,Q1,1240,24800.00,4.6\n"
        "North,Q2,1325,27185.50,4.7\n"
        "South,Q1,980,19890.25,4.2\n"
        "South,Q2,1104,22975.00,4.5\n"
        "East,Q1,1520,30512.75,4.8\n"
        "East,Q2,1603,32460.10,4.9\n"
        "West,Q1,870,17402.40,4.1\n"
        "West,Q2,945,19125.60,4.3\n",
    )
    write(
        os.path.join(staging, "data", "users.json"),
        '{\n  "generated": "2026-01-01T00:00:00Z",\n  "users": [\n'
        '    { "id": 1, "name": "Ada Lovelace", "role": "admin", "active": true },\n'
        '    { "id": 2, "name": "Alan Turing", "role": "editor", "active": true },\n'
        '    { "id": 3, "name": "Grace Hopper", "role": "viewer", "active": false }\n'
        "  ]\n}\n",
    )
    write(
        os.path.join(staging, "media", "badge.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" '
        'viewBox="0 0 240 64" role="img" aria-label="docs-viewer">\n'
        '  <rect width="240" height="64" rx="10" fill="#18181b"/>\n'
        '  <circle cx="34" cy="32" r="12" fill="#34d399"/>\n'
        '  <text x="60" y="38" font-family="system-ui, sans-serif" '
        'font-size="20" fill="#fafafa">docs-viewer</text>\n</svg>\n',
    )
    write(
        os.path.join(staging, "LICENSE.txt"),
        "Demo archive — MIT licensed.\n\n"
        "Generated for the @gntrees/docs-viewer playground. Safe to redistribute.\n",
    )
    write(os.path.join(staging, "docs", "report.pdf"), make_pdf())
    make_docx(os.path.join(staging, "docs", "report.docx"))
    make_xlsx(os.path.join(staging, "data", "summary.xlsx"))
    make_pptx(os.path.join(staging, "media", "slides.pptx"))

    # Inner files for the nested archive (zipped by the shell wrapper).
    write(
        os.path.join(nested, "inner-readme.md"),
        "# Nested archive\n\n"
        "You drilled into `nested/bundle.zip` without leaving the page — the "
        "breadcrumb just grew.\n",
    )
    write(
        os.path.join(nested, "inner-data.csv"),
        "key,value\nformat,zip-inside-zip\nextracted,greedy-longest-prefix\n",
    )


if __name__ == "__main__":
    main()

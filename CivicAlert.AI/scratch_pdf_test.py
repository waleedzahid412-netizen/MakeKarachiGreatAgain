import os
import pypdf

pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 56 >>
stream
BT
/F1 12 Tf
72 712 Td
(CivicAlert Karachi FAQ Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
349
%%EOF
"""

os.makedirs("scratch", exist_ok=True)
pdf_path = "scratch/test.pdf"
with open(pdf_path, "wb") as f:
    f.write(pdf_content)

try:
    reader = pypdf.PdfReader(pdf_path)
    print("Page count:", len(reader.pages))
    text = reader.pages[0].extract_text()
    print("Extracted text:", repr(text))
    print("PDF is valid!")
except Exception as e:
    print("PDF is invalid:", e)

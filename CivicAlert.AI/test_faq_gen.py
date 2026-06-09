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
<< /Length 1200 >>
stream
BT
/F1 12 Tf
72 800 Td
15 TL
(CivicAlert Karachi FAQ Document) Tj T*
() Tj T*
(CivicAlert Karachi is a community-driven platform for reporting local municipal issues in Karachi.) Tj T*
(Users can submit reports about water supply, sewer leaks, garbage, roads, traffic, and safety.) Tj T*
(Once 3 citizens confirm an issue, its status promotes to Verified and authorities are notified.) Tj T*
(KWSB manages water supply, drainage, and sewerage. SSWMB handles garbage and waste overflow.) Tj T*
(KMC Roads Department fixes potholes and road damage. K-Electric handles power outages and wires.) Tj T*
(KMC Parks Department maintains public parks. Karachi Traffic Police manages traffic signals.) Tj T*
(Sindh Police deals with safety and crime. NDMA coordinates flooding and heatwave responses.) Tj T*
(Users can contact support at support@civicalert.pk or call KMC general line at 1339.) Tj T*
ET
streamend
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
1500
%%EOF
"""

# Correctly calculate offsets
header = b"%PDF-1.4\n"
obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n"

stream_data = b"""BT
/F1 12 Tf
72 800 Td
15 TL
(CivicAlert Karachi FAQ Document) Tj T*
() Tj T*
(CivicAlert Karachi is a community-driven platform for reporting municipal issues in Karachi.) Tj T*
(Users can submit reports about water leaks, garbage, potholes, traffic, and power outages.) Tj T*
(Once 3 citizens verify a report, the status promotes to Verified and authorities are alerted.) Tj T*
(KWSB manages water supply and sewerage. SSWMB handles garbage collection and waste overflow.) Tj T*
(KMC Roads Department fixes potholes and road damage. K-Electric handles power outages.) Tj T*
(KMC Parks Department maintains parks. Karachi Traffic Police manages traffic signals.) Tj T*
(Sindh Police deals with safety and crime. NDMA coordinates flooding and disaster responses.) Tj T*
(Users can contact support at support@civicalert.pk or call KMC general line at 1339.) Tj T*
ET"""

obj4_body = f"4 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode('ascii') + stream_data + b"\nendstream\nendobj\n"

offsets = []
curr = len(header)
offsets.append(curr) # obj 1
curr += len(obj1)
offsets.append(curr) # obj 2
curr += len(obj2)
offsets.append(curr) # obj 3
curr += len(obj3)
offsets.append(curr) # obj 4

pdf_data = header + obj1 + obj2 + obj3 + obj4_body
start_xref = len(pdf_data)

# xref table starting with a dummy free object at index 0, then obj 1 to 4
xref = f"xref\n0 5\n0000000000 65535 f \n{offsets[0]:010d} 00000 n \n{offsets[1]:010d} 00000 n \n{offsets[2]:010d} 00000 n \n{offsets[3]:010d} 00000 n \n".encode('ascii')
trailer = f"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{start_xref}\n%%EOF\n".encode('ascii')

final_pdf = pdf_data + xref + trailer

with open("scratch/test_faq.pdf", "wb") as f:
    f.write(final_pdf)

reader = pypdf.PdfReader("scratch/test_faq.pdf")
print("Page count:", len(reader.pages))
print("Extracted text:")
print(reader.pages[0].extract_text())
print("Success!")

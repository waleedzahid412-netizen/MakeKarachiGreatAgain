import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from config.setting import Settings
from App.dependency import get_settings
from App.logger import setup_logger
from App.route import router, limiter
from App.ingest import init_pinecone, ingest_documents

# Load configurations
settings = get_settings()

# Initialize Daily Rotating Logger
logger = setup_logger(settings)
logger.info("Initializing CivicAlert AI Service...")

# Create FastAPI app
app = FastAPI(title="CivicAlert AI Service", version="1.0.0")

# Setup SlowAPI Rate Limiting Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded. Please try again later."}
))
app.add_middleware(SlowAPIMiddleware)

# Configure CORS (allow localhost:5035 and localhost:5173)
origins = [
    "http://localhost:5035",
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_default_faq_pdf():
    os.makedirs("Docs", exist_ok=True)
    pdf_path = "Docs/faq.pdf"
    if os.path.exists(pdf_path):
        return

    logger.info("Docs/faq.pdf not found. Generating default PDF document...")

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
    offsets.append(curr)
    curr += len(obj1)
    offsets.append(curr)
    curr += len(obj2)
    offsets.append(curr)
    curr += len(obj3)
    offsets.append(curr)

    pdf_data = header + obj1 + obj2 + obj3 + obj4_body
    start_xref = len(pdf_data)

    xref = f"xref\n0 5\n0000000000 65535 f \n{offsets[0]:010d} 00000 n \n{offsets[1]:010d} 00000 n \n{offsets[2]:010d} 00000 n \n{offsets[3]:010d} 00000 n \n".encode('ascii')
    trailer = f"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{start_xref}\n%%EOF\n".encode('ascii')

    final_pdf = pdf_data + xref + trailer

    with open(pdf_path, "wb") as f:
        f.write(final_pdf)
    logger.info("Docs/faq.pdf generated successfully.")

# Startup hooks
@app.on_event("startup")
async def on_startup():
    # 1. Compile FAQ PDF if missing
    generate_default_faq_pdf()
    
    # 2. Init Pinecone and run ingestion
    init_pinecone(settings)
    ingest_documents("Docs/faq.pdf", settings)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception occurred: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

# Include API Router
app.include_router(router)

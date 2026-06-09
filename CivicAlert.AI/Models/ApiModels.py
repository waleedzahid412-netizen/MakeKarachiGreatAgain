from pydantic import BaseModel, Field

class ModerationRequest(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)

class ModerationResponse(BaseModel):
    is_appropriate: bool
    reason: str | None = None
    confidence: float

class ClassifyRequest(BaseModel):
    title: str
    description: str
    category_name: str

class ClassifyResponse(BaseModel):
    department: str          # MUST match a seeded Department.Name
    confidence: float
    reasoning: str

class ChatRequest(BaseModel):
    question: str = Field(..., max_length=500)
    language: str = "en"

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

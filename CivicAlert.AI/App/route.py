from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from Models.ApiModels import (
    ModerationRequest, ModerationResponse,
    ClassifyRequest, ClassifyResponse,
    ChatRequest, ChatResponse
)
from App.dependency import (
    get_moderation_service,
    get_classifier_service,
    get_rag_chain,
    get_settings
)
from App.moderation import ModerationService
from App.classifier import ClassifierService
from App.rag_chain import RAGChain
from config.setting import Settings

# Create limiter
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/ai/moderate", response_model=ModerationResponse)
@limiter.limit("30/minute")
async def moderate(
    request: Request, # required by slowapi
    payload: ModerationRequest,
    service: ModerationService = Depends(get_moderation_service)
):
    return await service.moderate_report(payload)

@router.post("/ai/classify", response_model=ClassifyResponse)
@limiter.limit("30/minute")
async def classify(
    request: Request,
    payload: ClassifyRequest,
    service: ClassifierService = Depends(get_classifier_service)
):
    return await service.classify_report(payload)

@router.post("/ai/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    payload: ChatRequest,
    service: RAGChain = Depends(get_rag_chain)
):
    return await service.answer_question(payload)

@router.get("/ai/health")
async def health(settings: Settings = Depends(get_settings)):
    from App.ingest import is_pinecone_enabled
    return {
        "status": "ok",
        "model": settings.AI_MODEL,
        "pinecone_enabled": is_pinecone_enabled()
    }

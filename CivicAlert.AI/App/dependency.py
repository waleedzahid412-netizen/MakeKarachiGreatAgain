from config.setting import Settings
from App.moderation import ModerationService
from App.classifier import ClassifierService
from App.rag_chain import RAGChain

# Instantiate singletons
_settings = Settings()
_moderation_service = ModerationService(_settings)
_classifier_service = ClassifierService(_settings)
_rag_chain = RAGChain(_settings)

def get_settings() -> Settings:
    return _settings

def get_moderation_service() -> ModerationService:
    return _moderation_service

def get_classifier_service() -> ClassifierService:
    return _classifier_service

def get_rag_chain() -> RAGChain:
    return _rag_chain

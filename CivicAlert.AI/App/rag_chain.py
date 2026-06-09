import logging
from langchain_mistralai import ChatMistralAI
from Models.ApiModels import ChatRequest, ChatResponse
from App.security import detect_injection, build_safe_prompt, sanitize_input
from App.ingest import get_vectorstore, is_pinecone_enabled
from config.setting import Settings

logger = logging.getLogger("civicalert_ai")

class RAGChain:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.llm = ChatMistralAI(
            mistral_api_key=settings.MISTRAL_API_KEY,
            model=settings.AI_MODEL,
            temperature=0.0
        )

    async def answer_question(self, request: ChatRequest) -> ChatResponse:
        # 1. Prompt injection check
        injected, reason = detect_injection(request.question)
        if injected:
            logger.warning(f"Prompt injection detected in chat. Reason: {reason}")
            return ChatResponse(
                answer="I can only answer questions about CivicAlert and civic services in Karachi.",
                sources=[]
            )

        # 2. Check if Pinecone is enabled
        if not is_pinecone_enabled():
            logger.warning("RAG query requested but Pinecone service is offline/disabled.")
            return ChatResponse(
                answer="I don't have information about that. Please contact support. (RAG service is currently offline)",
                sources=[]
            )

        sanitized_question = sanitize_input(request.question)
        vectorstore = get_vectorstore()

        try:
            # Retrieve top 4 relevant chunks
            docs = vectorstore.similarity_search(sanitized_question, k=4)
            retrieved_chunks = "\n\n".join([f"--- Chunk {idx + 1} ---\n{doc.page_content}" for idx, doc in enumerate(docs)])
            
            # Map sources
            sources = []
            for doc in docs:
                source_file = doc.metadata.get("source", "faq.pdf")
                page = doc.metadata.get("page", 0)
                sources.append(f"{source_file} (Page {page + 1})")

            safe_prompt = f"""You are the official CivicAlert Karachi support assistant. Your job 

is to give DETAILED, HELPFUL answers to citizens about the CivicAlert 

platform.

RULES:

- Answer ONLY from the provided context below. Do not make up information.

- Give COMPLETE answers — include all relevant steps, details, and 

  specifics from the context. Never give one-line summaries.

- If the question asks 'how to' do something, give numbered step-by-step 

  instructions.

- If multiple context chunks are relevant, combine the information into 

  one comprehensive answer.

- If the answer is not in the context, say: 'I don't have specific 

  information about that. You can contact support at support@civicalert.pk 

  or use the Report an Issue feature for civic complaints.'

- Be friendly and professional.

- Language: respond in {request.language} (en = English, ur = Urdu).

  If ur, write the ENTIRE response in Urdu script.

CONTEXT:

{retrieved_chunks}

QUESTION: >>> {sanitized_question} <<<"""

            # Run LLM
            response = self.llm.invoke(safe_prompt)
            answer = str(response.content).strip()

            return ChatResponse(
                answer=answer,
                sources=list(set(sources)) # remove duplicate labels
            )

        except Exception as ex:
            logger.error(f"Failed to query RAG chain: {ex}")
            return ChatResponse(
                answer="An error occurred while retrieving information. Please try again or contact support.",
                sources=[]
            )

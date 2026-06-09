import os
import logging
from config.setting import Settings

logger = logging.getLogger("civicalert_ai")

PINECONE_ENABLED = False
vectorstore = None

def init_pinecone(settings: Settings):
    global PINECONE_ENABLED, vectorstore
    
    # If API keys are set to dummy placeholder values, disable Pinecone immediately
    if settings.PINECONE_API_KEY == "your_key" or settings.MISTRAL_API_KEY == "your_key":
        logger.warning("Pinecone/Mistral API keys are placeholder values. Disabling Pinecone RAG service.")
        PINECONE_ENABLED = False
        vectorstore = None
        return

    try:
        from pinecone import Pinecone, ServerlessSpec
        from langchain_pinecone import PineconeVectorStore
        from langchain_mistralai import MistralAIEmbeddings
        
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        
        # Check if the index exists
        existing_indexes = [idx.name for idx in pc.list_indexes()]
        if settings.PINECONE_INDEX_NAME not in existing_indexes:
            logger.info(f"Creating Pinecone index: {settings.PINECONE_INDEX_NAME}")
            pc.create_index(
                name=settings.PINECONE_INDEX_NAME,
                dimension=1024,  # Mistral Embeddings dimension
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            
        embeddings = MistralAIEmbeddings(
            mistral_api_key=settings.MISTRAL_API_KEY,
            model=settings.EMBEDDING_MODEL
        )
        
        vectorstore = PineconeVectorStore(
            index_name=settings.PINECONE_INDEX_NAME,
            embedding=embeddings,
            pinecone_api_key=settings.PINECONE_API_KEY
        )
        
        PINECONE_ENABLED = True
        logger.info("Pinecone service initialized successfully.")
    except Exception as ex:
        logger.error(f"Pinecone initialization failed: {ex}. RAG Chat service will be disabled.")
        PINECONE_ENABLED = False
        vectorstore = None

def ingest_documents(pdf_path: str, settings: Settings) -> int:
    global PINECONE_ENABLED, vectorstore
    if not PINECONE_ENABLED or vectorstore is None:
        logger.warning("Pinecone is disabled. Skipping document ingestion.")
        return 0

    if not os.path.exists(pdf_path):
        logger.error(f"Document ingestion failed: File not found at {pdf_path}")
        return 0

    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_mistralai import MistralAIEmbeddings
        
        logger.info(f"Loading document: {pdf_path}")
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        
        # Split text (semantic chunking with recursive fallback)
        chunks = []
        try:
            from langchain_experimental.text_splitter import SemanticChunker
            logger.info("Attempting SemanticChunker splitting...")
            embeddings = MistralAIEmbeddings(
                mistral_api_key=settings.MISTRAL_API_KEY,
                model=settings.EMBEDDING_MODEL
            )
            text_splitter = SemanticChunker(embeddings)
            chunks = text_splitter.split_documents(docs)
        except Exception as ex:
            logger.warning(f"SemanticChunker failed or not available ({ex}). Falling back to RecursiveCharacterTextSplitter.")
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            chunks = text_splitter.split_documents(docs)

        # Append indexes and source to metadata
        for idx, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = idx
            chunk.metadata["source"] = os.path.basename(pdf_path)

        # Check index density
        from pinecone import Pinecone
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index_stats = pc.Index(settings.PINECONE_INDEX_NAME).describe_index_stats()
        total_vector_count = index_stats.get("total_vector_count", 0)

        if total_vector_count == 0:
            logger.info(f"Pinecone index is empty. Upserting {len(chunks)} chunks...")
            vectorstore.add_documents(chunks)
            logger.info("Ingestion completed successfully.")
            return len(chunks)
        else:
            logger.info(f"Pinecone index already populated with {total_vector_count} vectors. Skipping ingestion.")
            return 0
    except Exception as ex:
        logger.error(f"Failed to ingest documents: {ex}")
        return 0

def get_vectorstore():
    global vectorstore
    return vectorstore

def is_pinecone_enabled():
    global PINECONE_ENABLED
    return PINECONE_ENABLED

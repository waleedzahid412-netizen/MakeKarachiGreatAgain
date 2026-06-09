import os
import logging
from logging.handlers import TimedRotatingFileHandler
from config.setting import Settings

def setup_logger(settings: Settings):
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    logger = logging.getLogger("civicalert_ai")
    logger.setLevel(settings.LOG_LEVEL)
    
    if not logger.handlers:
        formatter = logging.Formatter(
            '%(asctime)s - [%(levelname)s] - %(name)s - %(message)s'
        )
        
        # Daily rotating file handler, keep last 7 days
        log_file_path = os.path.join(log_dir, "ai_service.log")
        file_handler = TimedRotatingFileHandler(
            log_file_path,
            when="midnight",
            interval=1,
            backupCount=7,
            encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Stream (Console) Handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
    return logger

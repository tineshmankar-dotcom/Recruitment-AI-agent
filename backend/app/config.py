import os

class Settings:
    PROJECT_NAME: str = "RecruitIQ Backend"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recruitiq.db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "docx", "doc", "txt", "text", "md"]
    MAX_FILE_SIZE_MB: int = 15

settings = Settings()

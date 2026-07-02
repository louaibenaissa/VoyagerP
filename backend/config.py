from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-08-01-preview"
    
    # DeepSeek
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    
    # Default provider
    default_provider: Literal["azure", "deepseek"] = "azure"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

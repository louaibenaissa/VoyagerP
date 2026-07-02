from openai import AzureOpenAI, OpenAI
from typing import Literal, AsyncGenerator
from config import settings
import httpx


class AIProvider:
    """Unified AI provider supporting Azure OpenAI and DeepSeek."""
    
    def __init__(self):
        self._azure_client = None
        self._deepseek_client = None
    
    @property
    def azure_client(self) -> AzureOpenAI:
        if self._azure_client is None:
            self._azure_client = AzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
        return self._azure_client
    
    @property
    def deepseek_client(self) -> OpenAI:
        if self._deepseek_client is None:
            self._deepseek_client = OpenAI(
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
            )
        return self._deepseek_client
    
    def get_client(self, provider: Literal["azure", "deepseek"] = None):
        provider = provider or settings.default_provider
        if provider == "azure":
            return self.azure_client, settings.azure_openai_deployment
        else:
            return self.deepseek_client, "deepseek-chat"
    
    async def chat_completion(
        self,
        messages: list[dict],
        provider: Literal["azure", "deepseek"] = None,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ):
        """Generate a chat completion."""
        client, model = self.get_client(provider)
        
        if stream:
            return self._stream_completion(client, model, messages, temperature, max_tokens)
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    
    async def _stream_completion(
        self,
        client,
        model: str,
        messages: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        """Stream a chat completion."""
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


ai_provider = AIProvider()

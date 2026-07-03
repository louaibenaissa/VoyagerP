from typing import Literal, Optional
from dataclasses import dataclass
from ai_provider import ai_provider
from paper_parser import ParsedPaper


@dataclass
class AgentCommand:
    """Represents a user command to the agent."""
    action: Literal["summarize", "explain", "insights", "ask", "section"]
    target: Optional[str] = None  # Section name or specific question
    detail_level: Literal["brief", "detailed", "comprehensive"] = "detailed"


class ResearchPaperAgent:
    """AI Agent for analyzing and explaining research papers."""
    
    SYSTEM_PROMPT = """You are an expert research paper analyst. Your role is to help users understand academic papers by:

1. **Summarizing** - Provide clear, structured summaries at different levels of detail
2. **Explaining** - Break down complex concepts, methodologies, and findings in accessible language
3. **Providing Insights** - Offer critical analysis, identify key contributions, limitations, and implications
4. **Answering Questions** - Respond to specific questions about the paper's content

Guidelines:
- Use clear, precise language appropriate for the user's needs
- Structure your responses with headings and bullet points when helpful
- Highlight key terms and concepts
- Connect ideas across different sections of the paper
- Be objective and balanced in your analysis
- Acknowledge uncertainties or limitations in your interpretation

Always base your responses on the actual content of the paper provided."""

    def __init__(self):
        self.conversation_history: list[dict] = []
        self.current_paper: Optional[ParsedPaper] = None
    
    def load_paper(self, paper: ParsedPaper):
        """Load a paper for analysis."""
        self.current_paper = paper
        self.conversation_history = []
        
        # Create initial context message with paper content
        paper_context = self._create_paper_context(paper)
        self.conversation_history.append({
            "role": "system",
            "content": self.SYSTEM_PROMPT + "\n\n" + paper_context
        })
    
    def _create_paper_context(self, paper: ParsedPaper) -> str:
        """Create a context string from the parsed paper."""
        context_parts = [
            "=== RESEARCH PAPER ===",
            f"\nTitle: {paper.title}",
            f"Authors: {', '.join(paper.authors) if paper.authors else 'Unknown'}",
            f"Pages: {paper.page_count}",
        ]
        
        if paper.abstract:
            context_parts.append(f"\n--- Abstract ---\n{paper.abstract}")
        
        for section in paper.sections:
            context_parts.append(f"\n--- {section.title} (Pages {section.page_start}-{section.page_end}) ---")
            context_parts.append(section.content)
        
        return "\n".join(context_parts)
    
    async def process_command(
        self,
        command: AgentCommand,
        provider: Literal["azure", "deepseek"] = None,
        stream: bool = False,
    ):
        """Process a user command and generate a response."""
        if not self.current_paper:
            raise ValueError("No paper loaded. Please upload a paper first.")
        
        user_message = self._build_user_message(command)
        self.conversation_history.append({"role": "user", "content": user_message})
        
        if stream:
            return self._stream_response(provider)
        
        response = await ai_provider.chat_completion(
            messages=self.conversation_history,
            provider=provider,
            stream=False,
        )
        
        self.conversation_history.append({"role": "assistant", "content": response})
        return response
    
    async def _stream_response(self, provider: Literal["azure", "deepseek"] = None):
        """Stream the response and accumulate for history."""
        full_response = ""
        
        async for chunk in await ai_provider.chat_completion(
            messages=self.conversation_history,
            provider=provider,
            stream=True,
        ):
            full_response += chunk
            yield chunk
        
        self.conversation_history.append({"role": "assistant", "content": full_response})
    
    def _build_user_message(self, command: AgentCommand) -> str:
        """Build the user message based on the command."""
        detail_instructions = {
            "brief": "Provide a brief, concise response (2-3 paragraphs max).",
            "detailed": "Provide a detailed response with clear structure.",
            "comprehensive": "Provide a comprehensive, in-depth analysis covering all aspects.",
        }
        
        detail_note = detail_instructions[command.detail_level]
        
        if command.action == "summarize":
            if command.target:
                return f"Please summarize the '{command.target}' section of this paper. {detail_note}"
            return f"Please provide a summary of this research paper. {detail_note}"
        
        elif command.action == "explain":
            if command.target:
                return f"Please explain '{command.target}' from this paper in accessible terms. {detail_note}"
            return f"Please explain the key concepts and methodology of this paper. {detail_note}"
        
        elif command.action == "insights":
            if command.target:
                return f"Please provide insights and critical analysis of the '{command.target}' section. {detail_note}"
            return f"""Please provide insights on this paper including:
- Key contributions and novelty
- Strengths and limitations
- Implications and potential impact
- Questions or areas for further research
{detail_note}"""
        
        elif command.action == "section":
            section = command.target or "introduction"
            return f"Please analyze the '{section}' section in detail. {detail_note}"
        
        else:  # ask
            return command.target or "What are the main findings of this paper?"
    
    async def ask_question(
        self,
        question: str,
        provider: Literal["azure", "deepseek"] = None,
        stream: bool = False,
    ):
        """Ask a free-form question about the paper."""
        command = AgentCommand(action="ask", target=question)
        return await self.process_command(command, provider, stream)
    
    def get_paper_overview(self) -> dict:
        """Get a quick overview of the loaded paper."""
        if not self.current_paper:
            return None
        
        return {
            "title": self.current_paper.title,
            "authors": self.current_paper.authors,
            "abstract": self.current_paper.abstract[:500] + "..." if len(self.current_paper.abstract) > 500 else self.current_paper.abstract,
            "page_count": self.current_paper.page_count,
            "sections": [s.title for s in self.current_paper.sections],
        }
    
    def clear_history(self):
        """Clear conversation history while keeping the paper context."""
        if self.current_paper:
            self.conversation_history = [self.conversation_history[0]]  # Keep system message


# Global agent instance
research_agent = ResearchPaperAgent()

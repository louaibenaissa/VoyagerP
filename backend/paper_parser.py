import fitz  # PyMuPDF
from dataclasses import dataclass
from typing import Optional
import re


@dataclass
class PaperSection:
    title: str
    content: str
    page_start: int
    page_end: int


@dataclass
class ParsedPaper:
    title: str
    authors: list[str]
    abstract: str
    sections: list[PaperSection]
    full_text: str
    page_count: int
    metadata: dict


class PaperParser:
    """Parser for research papers in PDF format."""
    
    # Common section headers in research papers
    SECTION_PATTERNS = [
        r"^(?:I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|VIII\.|IX\.|X\.)\s+(.+)$",  # Roman numerals
        r"^(?:\d+\.)\s+(.+)$",  # Numbered sections
        r"^(?:Abstract|Introduction|Background|Related Work|Methodology|Methods|"
        r"Experiments|Results|Discussion|Conclusion|Conclusions|References|"
        r"Acknowledgments|Appendix)$",  # Standard headers
    ]
    
    def __init__(self):
        self.section_regex = [re.compile(p, re.IGNORECASE | re.MULTILINE) 
                              for p in self.SECTION_PATTERNS]
    
    def parse_pdf(self, pdf_bytes: bytes) -> ParsedPaper:
        """Parse a PDF file and extract structured content."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        full_text = ""
        page_texts = []
        
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            page_texts.append(text)
            full_text += f"\n--- Page {page_num + 1} ---\n{text}"
        
        # Extract metadata
        metadata = doc.metadata or {}
        
        # Extract title (usually the largest text on first page or from metadata)
        title = self._extract_title(page_texts[0] if page_texts else "", metadata)
        
        # Extract authors
        authors = self._extract_authors(page_texts[0] if page_texts else "", metadata)
        
        # Extract abstract
        abstract = self._extract_abstract(full_text)
        
        # Extract sections
        sections = self._extract_sections(full_text, len(doc))
        
        doc.close()
        
        return ParsedPaper(
            title=title,
            authors=authors,
            abstract=abstract,
            sections=sections,
            full_text=full_text,
            page_count=len(page_texts),
            metadata=metadata
        )
    
    def _extract_title(self, first_page: str, metadata: dict) -> str:
        """Extract the paper title."""
        if metadata.get("title"):
            return metadata["title"]
        
        # Usually the title is in the first few lines
        lines = first_page.strip().split("\n")
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 10 and len(line) < 200:
                return line
        
        return "Untitled Paper"
    
    def _extract_authors(self, first_page: str, metadata: dict) -> list[str]:
        """Extract author names."""
        if metadata.get("author"):
            return [a.strip() for a in metadata["author"].split(",")]
        
        # Simple heuristic: look for lines with names after title
        lines = first_page.strip().split("\n")
        authors = []
        
        for i, line in enumerate(lines[1:10]):
            line = line.strip()
            # Skip if it looks like an institution or email
            if "@" in line or any(word in line.lower() for word in 
                                   ["university", "institute", "department", "abstract"]):
                continue
            # Names are typically short lines with capitals
            if 5 < len(line) < 100 and line[0].isupper():
                # Check if it looks like a name (multiple capitalized words)
                words = line.split()
                if 1 < len(words) <= 6:
                    authors.append(line)
        
        return authors[:5]  # Limit to 5 authors
    
    def _extract_abstract(self, full_text: str) -> str:
        """Extract the abstract section."""
        # Look for abstract section
        patterns = [
            r"Abstract[:\s]*\n(.*?)(?=\n(?:I\.|1\.|Introduction|Keywords))",
            r"ABSTRACT[:\s]*\n(.*?)(?=\n(?:I\.|1\.|INTRODUCTION|Keywords))",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, full_text, re.DOTALL | re.IGNORECASE)
            if match:
                abstract = match.group(1).strip()
                # Clean up the abstract
                abstract = re.sub(r"\s+", " ", abstract)
                return abstract[:2000]  # Limit length
        
        return ""
    
    def _extract_sections(self, full_text: str, page_count: int) -> list[PaperSection]:
        """Extract paper sections."""
        sections = []
        
        # Split by common section headers
        section_pattern = re.compile(
            r"\n((?:I{1,3}V?|VI{0,3}|IX|X|\d+)\.\s+[A-Z][^\n]+|"
            r"(?:Abstract|Introduction|Background|Related Work|Methodology|Methods|"
            r"Experiments|Results|Discussion|Conclusion|Conclusions|References|"
            r"Acknowledgments|Appendix)[:\s]*)\n",
            re.IGNORECASE
        )
        
        matches = list(section_pattern.finditer(full_text))
        
        for i, match in enumerate(matches):
            title = match.group(1).strip()
            start_pos = match.end()
            end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
            
            content = full_text[start_pos:end_pos].strip()
            
            # Estimate page numbers
            text_before = full_text[:start_pos]
            page_markers = text_before.count("--- Page")
            page_start = max(1, page_markers)
            
            text_to_end = full_text[:end_pos]
            page_end = min(page_count, text_to_end.count("--- Page") + 1)
            
            sections.append(PaperSection(
                title=title,
                content=content[:5000],  # Limit content length
                page_start=page_start,
                page_end=page_end
            ))
        
        return sections
    
    def get_section_by_name(self, paper: ParsedPaper, section_name: str) -> Optional[PaperSection]:
        """Find a section by name (case-insensitive partial match)."""
        section_name_lower = section_name.lower()
        for section in paper.sections:
            if section_name_lower in section.title.lower():
                return section
        return None


paper_parser = PaperParser()

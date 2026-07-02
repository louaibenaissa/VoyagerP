# VoyagerP - Research Paper AI Assistant

An AI-powered research paper analysis tool that helps you understand, summarize, and gain insights from academic papers.

## Features

- **Upload PDF Papers** - Parse and analyze research papers in PDF format
- **AI-Powered Analysis** - Uses Azure OpenAI (GPT-4o) or DeepSeek V4 Flash
- **Multiple Commands**:
  - **Summarize** - Get structured summaries at different detail levels
  - **Explain** - Break down complex concepts and methodologies
  - **Insights** - Critical analysis, key contributions, and limitations
  - **Section Analysis** - Deep dive into specific paper sections
- **Interactive Chat** - Ask follow-up questions about the paper
- **Clean UI** - Minimalistic, modern interface with dark mode

## Architecture

```
VoyagerP/
├── backend/          # Python FastAPI backend
│   ├── main.py       # API endpoints
│   ├── agent.py      # Research paper AI agent
│   ├── ai_provider.py # Azure OpenAI & DeepSeek integration
│   ├── paper_parser.py # PDF parsing
│   └── config.py     # Configuration
│
└── frontend/         # Next.js frontend
    └── src/
        ├── app/      # Pages
        ├── components/ # UI components
        └── lib/      # API client & utilities
```

## Setup

### Backend

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## API Configuration

### Azure OpenAI
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### DeepSeek
```env
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## Usage

1. Upload a research paper PDF using the file upload area
2. View the paper overview (title, authors, abstract, sections)
3. Use command buttons to:
   - Get a summary of the entire paper
   - Explain key concepts
   - Get insights and critical analysis
   - Analyze specific sections
4. Ask follow-up questions in the chat input
5. Adjust detail level (Brief/Detailed/Comprehensive)
6. Switch between AI providers (Azure GPT-4o / DeepSeek V4)

## API Endpoints

- `POST /upload` - Upload and parse a PDF paper
- `GET /paper` - Get current paper overview
- `POST /command` - Execute analysis command
- `POST /ask` - Ask a question about the paper
- `POST /clear` - Clear conversation history
- `GET /config` - Get API configuration status

## License

MIT

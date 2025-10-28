# resume_parser.py
import fitz  # PyMuPDF
import re
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer

def parse_resume(pdf_path):
    """
    Parse PDF resume to extract text, hyperlinks, and generate summary
    Returns: {
        "full_text": str,
        "hyperlinks": list,
        "summary": str
    }
    """
    doc = fitz.open(pdf_path)
    full_text = ""
    hyperlinks = []
    
    # Extract text and hyperlinks
    for page_num in range(len(doc)):
        page = doc[page_num]
        full_text += page.get_text() + "\n"
        
        # Extract hyperlinks
        links = page.get_links()
        for link in links:
            if link.get('uri'):
                # Clean up common PDF hyperlink artifacts
                url = re.sub(r'\s+', '', link['uri'])
                if url.startswith(('http://', 'https://', 'mailto:')):
                    hyperlinks.append(url)
    
    # Remove duplicates while preserving order
    hyperlinks = list(dict.fromkeys(hyperlinks))
    
    # Generate summary (fallback to first 200 words if summarization fails)
    try:
        parser = PlaintextParser.from_string(full_text, Tokenizer("english"))
        summarizer = LexRankSummarizer()
        # Summarize to 5 sentences
        summary_sentences = summarizer(parser.document, 5)
        summary = " ".join(str(sentence) for sentence in summary_sentences)
    except Exception as e:
        print(f"Warning: Summarization failed ({e}). Using fallback summary.")
        summary = " ".join(full_text.split()[:200]) + "..."
    
    return {
        "full_text": full_text.strip(),
        "hyperlinks": hyperlinks,
        "summary": summary.strip()
    }
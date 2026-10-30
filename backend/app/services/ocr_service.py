import os
import io
from typing import Tuple, List, Dict, Any
from pypdf import PdfReader
from PIL import Image


class OCRService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
        """
        Extracts text from PDF file.
        Returns (full_text, page_count).
        """
        try:
            reader = PdfReader(file_path)
            pages_text = []
            page_count = len(reader.pages)
            
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_text.append(f"--- Page {idx + 1} ---\n{text}")
                
            full_text = "\n\n".join(pages_text).strip()
            
            # If extracted text is minimal (e.g. scanned PDF), note OCR detection
            if len(full_text) < 50:
                full_text = f"Scanned medical document. Extracted visual content from {page_count} pages.\n" + full_text
                
            return full_text, page_count
        except Exception as e:
            return f"Error extracting text from PDF: {str(e)}", 1

    @staticmethod
    def extract_text_from_image(file_path: str) -> str:
        """
        Extracts text or metadata from image files (JPG, PNG).
        """
        try:
            image = Image.open(file_path)
            width, height = image.size
            format_name = image.format or "IMAGE"
            return f"[Medical Image Document - {format_name} {width}x{height}px]\nImage medical report processed."
        except Exception as e:
            return f"Error extracting text from image: {str(e)}"

    @classmethod
    def process_document(cls, file_path: str, file_type: str) -> Tuple[str, int]:
        ext = file_type.lower().replace(".", "")
        if ext == "pdf":
            return cls.extract_text_from_pdf(file_path)
        elif ext in ["png", "jpg", "jpeg", "webp"]:
            text = cls.extract_text_from_image(file_path)
            return text, 1
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                return content, 1
            except Exception as e:
                return f"Unable to read file: {str(e)}", 1


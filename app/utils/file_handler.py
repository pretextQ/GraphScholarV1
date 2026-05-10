import os
from pathlib import Path
from typing import List
from pypdf import PdfReader
from bs4 import BeautifulSoup
import markdown
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.constants import CHUNK_SIZE, CHUNK_OVERLAP
from app.utils.logger import logger


# ---------- 文件解析函数（完全不变） ----------
def parse_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"PDF解析失败: {e}")
        raise


def parse_markdown(file_path: str) -> str:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        # 保留标题标记，方便分块器按章节切割
        lines = md_content.split('\n')
        result = []
        for line in lines:
            stripped = line.strip()
            # 保留标题行的 # 标记
            if stripped.startswith('#'):
                result.append(stripped)
            else:
                result.append(line)
        return '\n'.join(result)
    except Exception as e:
        logger.error(f"Markdown解析失败: {e}")
        raise


def parse_txt(file_path: str) -> str:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"TXT解析失败: {e}")
        raise


def parse_file(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == '.pdf':
        return parse_pdf(file_path)
    elif ext == '.md':
        return parse_markdown(file_path)
    elif ext == '.txt':
        return parse_txt(file_path)
    else:
        raise ValueError(f"不支持的文件类型: {ext}")


# ---------- 新的 LangChain 分割核心 ----------
def _split_with_langchain(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    separators: list = None
) -> List[str]:
    """
    使用 LangChain 的 RecursiveCharacterTextSplitter 进行分块
    :param separators: 自定义分隔符列表，不传则使用默认
    """
    if separators is None:
        # 按段落、句子边界递归切割（不在逗号处断开，避免句子中间被切）
        separators = ["\n\n", "\n", "。", ".", "；", ";", " ", ""]

    splitter = RecursiveCharacterTextSplitter(
        separators=separators,
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        length_function=len,
        keep_separator=False,   # 分隔符不保留在块中，保持文本干净
    )
    docs = splitter.create_documents([text])
    # 过滤掉空块（一般不会有，但以防万一）
    return [doc.page_content for doc in docs if doc.page_content.strip()]


# ---------- 对外接口 ----------
def split_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP
) -> List[str]:
    """通用文本分块"""
    return _split_with_langchain(text, chunk_size, overlap)


# Markdown 专用分隔符（保留标题边界）
_MARKDOWN_SEPARATORS = ["\n\n", "\n", "# ", "## ", "### ", "。", ".", "；", ";", " ", ""]


def split_text_by_type(
    text: str,
    file_type: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP
) -> List[str]:
    """根据文档类型智能分块"""
    if file_type == 'md':
        return _split_with_langchain(text, chunk_size, overlap, separators=_MARKDOWN_SEPARATORS)
    else:
        return _split_with_langchain(text, chunk_size, overlap)
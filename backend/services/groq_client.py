"""
Shared Groq client — single source of truth for API key, model name,
and the reusable JSON-extraction helper.
"""

import asyncio
import json
import os
import re

from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    """Lazy-init the Groq client so env vars are loaded first."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment variables.")
        _client = Groq(api_key=api_key)
    return _client


MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def extract_json(text: str) -> dict:
    """Extract JSON from response text, stripping markdown fences if present."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


async def async_chat_completion(**kwargs) -> str:
    """Run a sync Groq chat completion in a thread so the event loop isn't blocked."""
    client = get_client()

    def _call():
        resp = client.chat.completions.create(**kwargs)
        return resp.choices[0].message.content or "{}"

    return await asyncio.to_thread(_call)

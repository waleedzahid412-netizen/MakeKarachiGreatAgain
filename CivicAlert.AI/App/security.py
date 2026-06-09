import re

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above",
    r"disregard\s+(all\s+)?previous",
    r"forget\s+(all\s+)?previous",
    r"you\s+are\s+now",
    r"new\s+instruction",
    r"system\s*:",
    r"<\s*system\s*>",
    r"act\s+as\s+if",
    r"pretend\s+(you|to)\s+",
    r"override\s+(your|the)\s+",
    r"jailbreak",
    r"\[INST\]",
    r"\[SYS\]",
]

def sanitize_input(text: str) -> str:
    # Remove control characters
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    # Normalize whitespace
    cleaned = " ".join(cleaned.split())
    return cleaned

def detect_injection(text: str) -> tuple[bool, str | None]:
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"Suspicious pattern matched: {pattern}"
    return False, None

def build_safe_prompt(system_prompt: str, user_input: str) -> str:
    sanitized = sanitize_input(user_input)
    return f"{system_prompt}\n\nUSER INPUT START >>> {sanitized} <<< USER INPUT END"

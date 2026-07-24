import os
import requests
import json
import logging
from datetime import datetime
from anthropic import Anthropic
from app.config import settings

logger = logging.getLogger(__name__)

def get_block_attr(block, attr_name, default=None):
    if hasattr(block, attr_name):
        return getattr(block, attr_name)
    if hasattr(block, "__pydantic_extra__") and block.__pydantic_extra__ is not None:
        if attr_name in block.__pydantic_extra__:
            return block.__pydantic_extra__[attr_name]
    if isinstance(block, dict):
        return block.get(attr_name, default)
    return default

def content_to_dict(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        result = []
        for block in content:
            b_type = get_block_attr(block, "type")
            if b_type:
                block_dict = {"type": b_type}
                if b_type == "text":
                    block_dict["text"] = get_block_attr(block, "text", "")
                elif b_type == "tool_use":
                    block_dict["id"] = get_block_attr(block, "id")
                    block_dict["name"] = get_block_attr(block, "name")
                    block_dict["input"] = get_block_attr(block, "input")
                elif b_type == "thinking":
                    block_dict["thinking"] = get_block_attr(block, "thinking", "")
                    sig = get_block_attr(block, "signature")
                    if sig is not None:
                        block_dict["signature"] = sig
                result.append(block_dict)
            elif isinstance(block, dict):
                result.append(block)
        return result
    return str(content)

class Block:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

class APIResponse:
    def __init__(self, content, stop_reason):
        self.content = content
        self.stop_reason = stop_reason

def call_gemini_api(model: str, system_prompt: str, messages: list, tools: list, api_key: str) -> APIResponse:
    gemini_contents = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        parts = []
        
        gemini_role = "user" if role == "user" else "model"
        
        if isinstance(content, str):
            parts.append({"text": content})
        elif isinstance(content, list):
            for part in content:
                p_type = get_block_attr(part, "type")
                if p_type == "text":
                    parts.append({"text": get_block_attr(part, "text", "")})
                elif p_type == "tool_use":
                    part_dict = {
                        "functionCall": {
                            "name": get_block_attr(part, "name"),
                            "args": get_block_attr(part, "input", {})
                        }
                    }
                    sig = get_block_attr(part, "signature")
                    if sig:
                        part_dict["thoughtSignature"] = sig
                    parts.append(part_dict)
                elif p_type == "tool_result":
                    res_content = get_block_attr(part, "content")
                    try:
                        resp_data = json.loads(res_content)
                    except:
                        resp_data = {"result": res_content}
                    parts.append({
                        "functionResponse": {
                            "name": get_block_attr(part, "tool_use_id") or "tool_result",
                            "response": resp_data
                        }
                    })
        
        gemini_contents.append({
            "role": gemini_role,
            "parts": parts
        })

    gemini_tools = []
    if tools:
        declarations = []
        for t in tools:
            input_schema = t.get("input_schema", {})
            properties = {}
            for k, v in input_schema.get("properties", {}).items():
                prop_type = v.get("type", "string").upper()
                if prop_type == "NUMBER":
                    prop_type = "NUMBER"
                properties[k] = {
                    "type": prop_type,
                    "description": v.get("description", "")
                }
                if "enum" in v:
                    properties[k]["enum"] = v["enum"]
            
            declarations.append({
                "name": t.get("name"),
                "description": t.get("description"),
                "parameters": {
                    "type": "OBJECT",
                    "properties": properties,
                    "required": input_schema.get("required", [])
                }
            })
        gemini_tools.append({"functionDeclarations": declarations})

    payload = {
        "contents": gemini_contents,
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        }
    }
    if gemini_tools:
        payload["tools"] = gemini_tools

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    logger.info(f"Calling Gemini API with model: {model}")
    response = requests.post(url, json=payload, headers=headers, timeout=90)
    if response.status_code != 200:
        raise ValueError(f"Gemini API returned error ({response.status_code}): {response.text}")
        
    res_json = response.json()
    candidates = res_json.get("candidates", [])
    if not candidates:
        error_msg = res_json.get("error", {}).get("message", "No content candidates returned")
        raise ValueError(f"Gemini API returned error: {error_msg}")
        
    candidate = candidates[0]
    content = candidate.get("content", {})
    parts = content.get("parts", [])
    
    mapped_parts = []
    stop_reason = "end_turn"
    
    for part in parts:
        if "text" in part:
            mapped_parts.append(Block(type="text", text=part["text"]))
        elif "functionCall" in part:
            call = part["functionCall"]
            mapped_parts.append(Block(
                type="tool_use",
                id=f"call_{int(datetime.now().timestamp())}_{os.urandom(2).hex()}",
                name=call["name"],
                input=call.get("args", {}),
                signature=part.get("thoughtSignature")
            ))
            stop_reason = "tool_use"
            
    return APIResponse(mapped_parts, stop_reason)

def call_llm(system_prompt: str, messages: list, tools: list) -> APIResponse:
    if settings.GEMINI_API_KEY:
        model = settings.MODEL_NAME
        if "gemini" not in model.lower() or "gemini-1.5-flash" in model.lower() or "gemini-2.5-flash" in model.lower() or "lite" in model.lower():
            model = "gemini-flash-latest"
        return call_gemini_api(model, system_prompt, messages, tools, settings.GEMINI_API_KEY)
    else:
        api_key = settings.ANTHROPIC_API_KEY or "mock_key"
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=1500,
            system=system_prompt,
            messages=messages,
            tools=tools
        )
        return APIResponse(response.content, response.stop_reason)

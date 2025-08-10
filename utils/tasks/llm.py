import re
from dotenv import load_dotenv
import utils.log as LOG
import utils.tasks.query_load as QUERY
import utils.prompting as prompting
import json
from typing import Callable, Any, Awaitable
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

class OpenAIClient:
    def __init__(self, api_key, base_url, model_name=None):
        self.api_key = api_key
        self.base_url = base_url
        self.model_name = model_name

# --- Helper Functions  ---

def process_llm_response(content: str) -> dict:
    """
    Parses the LLM's string response into a dictionary.
    Handles raw JSON strings and JSON within markdown code blocks.
    """
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                return {"text": content} # Return original content if extracted JSON is invalid
        else:
            return {"text": content} # Return original content if no JSON is found

async def stream_simple_chain(chain, inputs, send_event: Callable[[str, Any], Awaitable[None]]) -> str:
    """
    Streams a simple chain for tasks like query_analysis.
    Sends text chunks to the client.
    """
    full_content = ""
    try:
        async for chunk in chain.astream(inputs):
            content_piece = chunk.content
            if content_piece:
                full_content += content_piece
                await send_event("chunk", {"text": content_piece})
    except Exception as e:
        LOG.logger.error(f"Error during LangChain stream: {e}", exc_info=True)
        await send_event("error", f"Streaming Error: {e}")
    return full_content

async def stream_chat_chain(chain, inputs, send_event: Callable[[str, Any], Awaitable[None]]) -> str:
    """
    Streams a chain specifically for the inspiration chat.
    Sends a richer payload (`delta`, `content`, `message`) for the chat UI.
    """
    full_content = ""
    try:
        async for chunk in chain.astream(inputs):
            content_piece = chunk.content
            if content_piece:
                full_content += content_piece
                payload = {
                    "delta": content_piece,
                    "content": full_content,
                    "message": {"role": "assistant", "content": full_content}
                }
                await send_event("chunk", payload)
    except Exception as e:
        LOG.logger.error(f"Error during LangChain chat stream: {e}", exc_info=True)
        await send_event("error", f"Streaming Error: {e}")
    return full_content

# --- Refactored Core Logic ---

async def query_analysis(query: str, documents: str, model, send_event: Callable[[str, Any], Awaitable[None]]):
    """
    Refactored to use LangChain for query analysis.
    """
    LOG.logger.info(f"Using LangChain model for query analysis (Stream: True)")

    user_content = f'''
        query: {query if query else "No query provided"}
        context: {documents if documents else "No additional context provided"}
    '''
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=prompting.get_prompt('QUERY_EXPLAIN_SYSTEM_PROMPT')),
        HumanMessage(content=user_content)
    ])
    chain = prompt | model

    # Use the new streaming helper
    full_content = await stream_simple_chain(chain, {}, send_event)

    if full_content:
        processed_response = process_llm_response(full_content)
        await send_event("result", processed_response)


async def query(current_user: dict, query_text: str, design_doc: str, send_event: Callable[[str, Any], Awaitable[None]]):
    """
    Endpoint entry function. Now initializes a LangChain model.
    """
    print(f"User {current_user['email']} is calling /api/query")
    load_dotenv()
    
    # Initialize LangChain model instead of custom client
    model = init_chat_model(
        model=current_user.get('model_name') or "deepseek-chat",
        model_provider="openai",
        api_key=current_user.get('api_key'),
        base_url=current_user.get('api_url') or "https://api.deepseek.com/v1",
        streaming=True
    )
    
    await query_analysis(query_text, design_doc, model, send_event)


async def _inspiration_chat_streamer(inspiration: str, new_message: str, model, chat_history: list, send_event: Callable[[str, Any], Awaitable[None]]):
    """
    Refactored to use LangChain for inspiration chat.
    """
    LOG.logger.info(f"Using LangChain model for inspiration chat (Stream: True)")
    
    system_prompt = prompting.get_prompt('INSPIRATION_CHAT_SYSTEM_PROMPT')
    messages = [SystemMessage(content=system_prompt)]
    
    if chat_history and isinstance(chat_history, list):
        messages.extend([HumanMessage(content=msg['content']) if msg['role'] == 'user' else SystemMessage(content=msg['content']) for msg in chat_history])
        messages.append(HumanMessage(content=new_message))
    else:
        messages.append(HumanMessage(content=f"Inspiration: {inspiration}\nContext: {new_message}"))

    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | model
    
    # Use the chat-specific streaming helper
    full_content = await stream_chat_chain(chain, {}, send_event)
    
    if full_content:
        final_payload = {
            "content": full_content,
            "message": {"role": "assistant", "content": full_content}
        }
        await send_event("result", final_payload)


async def handle_inspiration_chat(current_user: dict, inspiration_id: str, new_message: str, chat_history: list, send_event: Callable[[str, Any], Awaitable[None]]):
    """
    Endpoint entry function for inspiration chat. Now initializes a LangChain model.
    """
    print(f"User {current_user['email']} is calling /task/inspiration/chat (Stream: True)")
    inspiration_doc = await QUERY.query_solution(inspiration_id)
    # Extract the relevant inspiration content, assuming it's in a specific field
    inspiration_text = json.dumps(inspiration_doc) if inspiration_doc else "No inspiration found."

    # Initialize LangChain model
    model = init_chat_model(
        model=current_user.get('model_name') or "deepseek-chat",
        model_provider="openai",
        api_key=current_user.get('api_key'),
        base_url=current_user.get('api_url') or "https://api.deepseek.com/v1",
        streaming=True
    )
    
    await _inspiration_chat_streamer(inspiration_text, new_message, model, chat_history, send_event)
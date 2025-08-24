import os
import httpx
from dotenv import load_dotenv
import utils.prompting as prompting
import utils.db as RAG
import utils.log as LOG
import json
import requests
import re
import asyncio

async def _stream_openai_response(http_client, data, headers):
    try:
        async with http_client.stream('POST', "/chat/completions", json=data, headers=headers) as response:
            response.raise_for_status()
            async for chunk in response.aiter_lines():
                if chunk.startswith('data: '):
                    chunk = chunk[6:]
                    if chunk.strip() == '[DONE]':
                        break
                    try:
                        content = json.loads(chunk)
                        delta = content.get('choices', [{}])[0].get('delta', {})
                        if 'content' in delta and delta.get('content') is not None: # Ensure content exists and is not None
                            yield {'content': delta['content']}
                        elif delta.get('finish_reason') is not None:
                             # Optionally yield finish reason if needed, or just ignore
                             # yield {'finish_reason': delta['finish_reason']}
                             pass 
                    except json.JSONDecodeError:
                        LOG.logger.warning(f"Failed to decode JSON chunk: {chunk}")
                elif chunk:
                    LOG.logger.warning(f"Received non-data chunk: {chunk}")
    except httpx.HTTPStatusError as e:
        error_body = "Unknown error body"
        try:
            error_body = await e.response.aread()
        except Exception as read_err:
            LOG.logger.error(f"Failed to read error response body: {read_err}")
        LOG.logger.error(f"HTTP error during streaming: {e.response.status_code} - {error_body}")
        yield {'error': f"HTTP error: {e.response.status_code}"}
    except Exception as e:
        LOG.logger.error(f"Error during OpenAI stream: {e}", exc_info=True)
        yield {'error': f"Streaming error: {str(e)}"}

async def make_openai_request(messages, model, client, stream=False):
    headers = {
        "Authorization": f"Bearer {client.api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model,
        "messages": messages
    }
    
    if stream:
        headers["Accept"] = "text/event-stream"
        data["stream"] = True

    async with httpx.AsyncClient(base_url=client.base_url, timeout=300.0) as http_client:
        if stream:
            # Call the extracted stream handler
            return _stream_openai_response(http_client, data, headers)
        else:
            try:
                response = await http_client.post("/chat/completions", json=data, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                 error_body = "Unknown error body"
                 try:
                     error_body = await e.response.aread()
                 except Exception as read_err:
                     LOG.logger.error(f"Failed to read error response body: {read_err}")
                 LOG.logger.error(f"HTTP error in non-stream request: {e.response.status_code} - {error_body}")
                 # Re-raise the exception or return an error structure consistent with your error handling
                 raise e # Or return an error dict/object
            except Exception as e:
                LOG.logger.error(f"Error during OpenAI non-stream request: {e}", exc_info=True)
                raise e # Or return an error dict/object

async def make_image_request(prompt, client):
    headers = {
        "Authorization": f"Bearer {client.api_key}",
        "Content-Type": "application/json"
    }
    
    # Use client's model_name or fallback to dall-e-3
    model_name = client.model_name or "dall-e-3"
    
    data = {
        "model": model_name,
        "prompt": prompt,
        "size": "1024x1024",
        "quality": "standard",
        "n": 1
    }
    
    LOG.logger.info(f"Making image request with model: {model_name}, base_url: {client.base_url}")
    
    try:
        async with httpx.AsyncClient(base_url=client.base_url, timeout=60.0) as http_client:
            response = await http_client.post("/images/generations", json=data, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        error_body = "Unknown error body"
        try:
            error_body = await e.response.aread()
            error_body = error_body.decode()
        except Exception as read_err:
            LOG.logger.error(f"Failed to read error response body: {read_err}")
        LOG.logger.error(f"HTTP error in image request: {e.response.status_code} - {error_body}")
        raise e
    except Exception as e:
        LOG.logger.error(f"Error during image request: {e}", exc_info=True)
        raise e
    
# -----------------------------------------------------------------------------

# Add a helper function to process LLM response content
def process_llm_response(content):
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # If content is not JSON format, try to extract JSON part from content
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                # If extracted JSON part parsing fails, return original content as text
                return {"text": content}
        else:
            # If no JSON part found, return original content as text
            return {"text": content}

async def knowledge_extraction(paper, client, user_type=None, stream=False):
    model_name = client.model_name or "deepseek-chat"
    LOG.logger.info(f"Using model {model_name} for knowledge extraction (Stream: {stream}, User Type: {user_type})")
    
    result_gen = await make_openai_request(
        messages=[
            {"role": "system", "content": prompting.get_prompt('KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT')},
            {"role": "user", "content": paper},
        ],
        model=model_name,
        client=client,
        stream=stream
    )
    
    if stream:
        return result_gen
    else:
        content = result_gen['choices'][0]['message']['content']
        return process_llm_response(content)

async def query_analysis(query, documents, client, user_type=None, stream=False):
    model_name = client.model_name or "deepseek-chat"
    LOG.logger.info(f"Using model {model_name} for query analysis (Stream: {stream}, User Type: {user_type})")
    
    user_content = f'''
        query: {query if query else "No query provided"}
        context: {documents if documents else "No additional context provided"}
    '''
    
    result_gen = await make_openai_request(
        messages=[
            {"role": "system", "content": prompting.get_prompt('QUERY_EXPLAIN_SYSTEM_PROMPT')},
            {"role": "user", "content": user_content},
        ],
        model=model_name,
        client=client,
        stream=stream
    )
    
    if stream:
        return result_gen
    else:
        content = result_gen['choices'][0]['message']['content']
        return process_llm_response(content)

# -----------------------------------------------------------------------------

async def drawing_expert_system(target_user, technical_method, possible_results, client, user_type=None):
    # Image generation function doesn't need to use model name as it uses specialized image API
    LOG.logger.info(f"Using image generation API for drawing expert system (User Type: {user_type})")
    
    # Create a more natural prompt that won't trigger safety systems
    user_content = f"Create a professional illustration showing {technical_method} being used by {target_user} to achieve {possible_results}. The image should be clean, modern, and visually appealing, suitable for a technical presentation or educational material."
    
    LOG.logger.info(f"Generated prompt: {user_content}")
 
    response = await make_image_request(user_content, client)
    return response['data'][0]

async def html_generator(useage_scenario, solutions, client, stream=False):
    model_name = client.model_name or "deepseek-chat"
    LOG.logger.info(f"Using model {model_name} for HTML generator (Stream: {stream})")
    
    result_gen = await make_openai_request(
        messages=[
            {"role": "system", "content": prompting.get_prompt('HTML_GENERATION_SYSTEM_PROMPT')},
            {"role": "user", "content": f"Usage Scenario: {useage_scenario}\nSolutions: {solutions}"},
        ],
        model=model_name,
        client=client,
        stream=stream
    )
    
    if stream:
        return result_gen
    else:
        content = result_gen['choices'][0]['message']['content']
        return process_llm_response(content)

# -----------------------------------------------------------------------------

async def inspiration_chat(inspiration, new_message, client, chat_history=None, user_type=None, stream=False):
    model_name = client.model_name or "deepseek-chat"
    LOG.logger.info(f"Using model {model_name} for inspiration chat (Stream: {stream}, User Type: {user_type})")
    
    messages = [
        {"role": "system", "content": prompting.get_prompt('INSPIRATION_CHAT_SYSTEM_PROMPT')},
    ]
    
    # Build message history
    if chat_history and isinstance(chat_history, list):
        messages.extend(chat_history)
        messages.append({"role": "user", "content": new_message})
    else:
        # If no history, provide inspiration as context
        messages.append({"role": "user", "content": f"Inspiration: {inspiration}\nContext: {new_message}"})
    
    result_gen = await make_openai_request(
        messages=messages,
        model=model_name,
        client=client,
        stream=stream
    )

    if stream:
        # Define the async generator for streaming response format
        async def stream_formatter():
            full_content = ""
            async for chunk in result_gen:
                if 'error' in chunk:
                    LOG.logger.error(f"Stream error received in inspiration_chat: {chunk['error']}")
                    yield chunk # Propagate error
                    return # Stop on error
                
                content_piece = chunk.get('content', '')
                if content_piece:
                    full_content += content_piece
                    yield {
                        "delta": content_piece,
                        "content": full_content,
                        "message": {"role": "assistant", "content": full_content}
                    }
        return stream_formatter()
    else:
        # Handle non-stream response
        content = result_gen['choices'][0]['message']['content']
        processed_result = process_llm_response(content)
        
        # Ensure the response format includes 'message' and 'response' field
        if isinstance(processed_result, str) or "text" in processed_result:
             text_content = processed_result if isinstance(processed_result, str) else processed_result.get("text", "")
             return {
                 "response": text_content,
                 "message": {"role": "assistant", "content": content}
             }
        
        processed_result["message"] = {"role": "assistant", "content": content}
        # Ensure a 'response' field exists, potentially duplicating content if not JSON
        if "response" not in processed_result:
            processed_result["response"] = content 
        return processed_result

def simple_completion(prompt, client, model=None):
    """
    A simple function to test API connection by sending a basic completion request
    
    Args:
        prompt (str): The prompt to send
        client (OpenAIClient): The client instance
        model (str, optional): The model to use, overrides client.model_name if provided
        
    Returns:
        str: The response text
    
    Raises:
        Exception: With detailed error information from the API
    """
    try:
        # Prioritize passed model parameter, then client's model_name, finally default model
        model_to_use = model or client.model_name or "deepseek-chat"
        LOG.logger.info(f"Using model {model_to_use} for simple completion")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {client.api_key}",
        }
        
        payload = {
            "model": model_to_use,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        base_url = client.base_url or "https://api.deepseek.com/v1"
        LOG.logger.info(f"Making API request to {base_url} with model {model_to_use}")
        
        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            LOG.logger.info(f"API request successful with status code {response.status_code}")
            return response.json()["choices"][0]["message"]["content"]
        else:
            error_info = {
                "status_code": response.status_code,
                "text": response.text,
                "url": base_url,
                "model": model_to_use
            }
            error_msg = f"API error: {response.status_code} - {response.text}"
            LOG.logger.error(error_msg)
            
            # Raise exception with detailed error information
            raise Exception(json.dumps(error_info))
    
    except requests.exceptions.RequestException as re:
        error_msg = f"Network error in API request: {str(re)}"
        LOG.logger.error(error_msg)
        raise Exception(error_msg)
    except json.JSONDecodeError as je:
        error_msg = f"Invalid JSON response from API: {str(je)}"
        LOG.logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Error in simple_completion: {str(e)}"
        LOG.logger.error(error_msg)
        raise Exception(error_msg)


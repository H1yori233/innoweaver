from typing import TypedDict, List, Dict, Any, Optional, Callable, Awaitable
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain.chat_models import init_chat_model
from IPython.display import Image, display
from langgraph.graph import StateGraph, START, END
from typing import Literal
import json
import re
import os

from utils.tasks.config import solution_eval, convert_objectid_to_str
import utils.db as RAG
import utils.prompting as prompting
import utils.tasks.query_load as QUERY
import asyncio
import utils.tasks.task as TASK
import utils.main as MAIN
from utils.image import process_and_upload_image
from utils.tasks.llm import OpenAIClient

# ------------------------------------------------------------
# State Definition

class ResearchState(TypedDict):
    # user
    model: Any
    current_user: Dict[str, Any]
    send_event: Callable[[str, Any], Awaitable[None]]
    with_paper: bool
    with_example: bool
    is_drawing: bool
    
    # input
    query: str
    query_analysis_result: Dict[str, Any]
    
    # intermediate
    rag_results: Dict[str, Any]
    domain_knowledge: List[Dict[str, Any]]
    init_solution: Dict[str, Any]
    iterated_solution: Dict[str, Any]
    final_solution: Dict[str, Any]
    
    # progress tracking
    progress: int
    status: str
    # task_id: str
    
    # error handling
    error: Optional[str]
    
# ------------------------------------------------------------

async def stream_chain(chain, inputs, state: ResearchState) -> str:
    chunks = []
    async for msg_chunk in chain.astream(inputs, stream_mode="messages"):
        if hasattr(msg_chunk, "content") and msg_chunk.content:
            await state["send_event"]("chunk", {"text": msg_chunk.content})
            chunks.append(msg_chunk.content)
    return "".join(chunks)

def process_llm_response(content):
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # if content is not json, try to extract json from content
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                # if extract json failed, return content as text
                return {"text": content}
        else:
            # if no json found, return content as text
            return {"text": content}

# ------------------------------------------------------------
# Nodes Definition
    
async def rag_node(state: ResearchState):
    # print("rag_node")
    query = state["query"]
    query_analysis_result = state["query_analysis_result"]
    rag_results = RAG.search_in_meilisearch(query, query_analysis_result.get("Requirement", ""))
    
    state['progress'] = 30
    state['status'] = "RAG search completed"
    state['domain_knowledge'] = rag_results.get('hits', [])
    
    # Send node completion event
    await state['send_event']("node_complete", {
        "node": "rag",
        "result": rag_results
    })
    
    return state

async def paper_node(state: ResearchState):
    # print("paper_node")
    paper_ids = state.get("paper_ids", [])
    papers = await asyncio.gather(*[
        QUERY.query_paper(paper_id) for paper_id in paper_ids
    ])
    rag_results = {
        "hits": [{"paper_id": paper_id, "content": paper} 
                for paper_id, paper in zip(paper_ids, papers)]
    }
    
    state['progress'] = 35
    state['status'] = "Paper processing completed"
    state['domain_knowledge'] = rag_results
    return state

async def example_node(state: ResearchState):
    # print("example_node")
    example_ids = state.get("example_ids", [])
    existing_rag_results = state.get("domain_knowledge", {"hits": []})
    
    if not isinstance(existing_rag_results, dict) or 'hits' not in existing_rag_results:
        existing_rag_results = {"hits": []}
    if not isinstance(existing_rag_results['hits'], list):
        existing_rag_results['hits'] = []

    solutions = await asyncio.gather(*[
        QUERY.query_solution(str(solution_id)) for solution_id in example_ids
    ])
    new_hits = [
        {"solution_id": str(solution_id), "content": solution} 
        for solution_id, solution in zip(example_ids, solutions) if solution is not None
    ]
    existing_rag_results['hits'].extend(new_hits)
    
    state['progress'] = 35
    state['status'] = "Example solutions added"
    state['domain_knowledge'] = existing_rag_results
    return state

async def domain_expert_node(state: ResearchState):
    # print("domain_expert_node")
    query = state["query"]
    domain_knowledge = state["domain_knowledge"]
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=prompting.get_prompt('DOMAIN_EXPERT_SYSTEM_PROMPT')),
        HumanMessage(content=f"query: {query}\nDomain Knowledge: {domain_knowledge}")
    ])
    
    model = state['model']
    chain = prompt | model
    response = await stream_chain(chain, {"query": state['query']}, state)
    
    state['progress'] = 60
    state['status'] = "Domain analysis completed"
    state['init_solution'] = process_llm_response(response)
    
    # Send node completion event
    await state['send_event']("node_complete", {
        "node": "domain_expert",
        "result": state['init_solution']
    })
    
    return state

async def interdisciplinary_node(state: ResearchState):
    # print("interdisciplinary_node")
    query = state["query"]
    domain_knowledge = state["domain_knowledge"]
    init_solution = state["init_solution"]
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=prompting.get_prompt('INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT')),
        HumanMessage(content=f"query: {query}\nDomain Knowledge: {domain_knowledge}\nInitial Solution: {init_solution}")
    ])
    
    model = state['model']
    chain = prompt | model
    response = await stream_chain(chain, {"query": state['query']}, state)
    
    state['progress'] = 70
    state['status'] = "Interdisciplinary analysis completed"
    state['iterated_solution'] = process_llm_response(response)
    
    # Send node completion event
    await state['send_event']("node_complete", {
        "node": "interdisciplinary",
        "result": state['iterated_solution']
    })
    
    return state

async def evaluation_node(state: ResearchState):
    # print("evaluation_node")
    query = state["query"]
    domain_knowledge = state["domain_knowledge"]
    init_solution = state["init_solution"]
    iterated_solution = state["iterated_solution"]
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=prompting.get_prompt('PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT')),
        HumanMessage(content=f"query: {query}\nDomain Knowledge: {domain_knowledge}\nInitial Solution: {init_solution}\nIterated Solution: {iterated_solution}")
    ])
    
    model = state['model']
    chain = prompt | model
    response = await stream_chain(chain, {"query": state['query']}, state)
    
    state['progress'] = 80
    state['status'] = "Solution evaluation completed"
    state['final_solution'] = process_llm_response(response)
    
    # Send node completion event
    await state['send_event']("node_complete", {
        "node": "evaluation",
        "result": state['final_solution']
    })
    
    return state

async def drawing_node(state: ResearchState):
    # print("drawing_node")
    query_analysis_result = state["query_analysis_result"]
    final_solution = state["final_solution"]
    current_user = state["current_user"]
    user_type = current_user.get("user_type", "None Type")
    
    # Parse final_solution using solution_eval
    final_solution = solution_eval(final_solution)

    if not final_solution or "solutions" not in final_solution:
        state['error'] = "final_solution error"
        state['progress'] = 85
        state['status'] = "Image generation failed"
        return state

    target_user = query_analysis_result.get('Target User', 'null')
    
    # Setup drawing API client
    BASE_URL = os.getenv("DRAW_URL")
    API_KEY = os.getenv("DRAW_API_KEY")
    MODEL_NAME = os.getenv("DRAW_MODEL")
    
    client = OpenAIClient(
        api_key=API_KEY,
        base_url=BASE_URL,
        model_name=MODEL_NAME
    )
    SM_MS_API_KEY = os.getenv("SM_MS_API_KEY")
    
    total_solutions = len(final_solution["solutions"])
    
    for i, solution in enumerate(final_solution["solutions"]):
        technical_method = solution.get("Technical Method")
        possible_results = solution.get("Possible Results")
        
        # Update progress for each image generation
        current_progress = 80 + (i + 1) * 10 / total_solutions
        await state["send_event"]("progress", int(current_progress))
        await state["send_event"]("status", f"Generating image {i+1}/{total_solutions}...")
        
        try:
            # Generate image using drawing_expert_system
            image_data = await MAIN.drawing_expert_system(target_user, technical_method, possible_results, client, user_type=user_type)
            
            # Process and upload image
            image_url, image_name = await process_and_upload_image(image_data['url'], SM_MS_API_KEY)
            final_solution["solutions"][i]["image_url"] = image_url
            final_solution["solutions"][i]["image_name"] = image_name
            
        except Exception as e:
            print(f"Failed to process image {i}: {e}")
            # Continue with other images even if one fails
            continue
    
    state['progress'] = 90
    state['status'] = "Image generation completed"
    state['final_solution'] = final_solution
    
    # Send node completion event
    await state['send_event']("node_complete", {
        "node": "drawing",
        "result": final_solution
    })
    
    return state

async def persistence_node(state: ResearchState):
    print("persistence_node")
    query = state["query"]
    query_analysis_result = state["query_analysis_result"]
    domain_knowledge = state["domain_knowledge"]
    final_solution = state["final_solution"]
    
    try:
        # Save solution to database
        solution_ids = await TASK.insert_solution(state["current_user"], query, query_analysis_result, final_solution)
        await TASK.paper_cited(domain_knowledge, solution_ids)
    
        # Get saved solutions
        solutions = await asyncio.gather(*[
            QUERY.query_solution(str(solution_id)) for solution_id in solution_ids
        ])
        solutions = [convert_objectid_to_str(solution) for solution in solutions]
        final_solution['solutions'] = solutions
    except Exception as e:
        print(f"Error saving solution: {e}")
    
    state['progress'] = 100
    state['status'] = "Task completed"
    
    # Send final completion event with solutions
    await state['send_event']("node_complete", {
        "node": "persistence",
        "result": final_solution
    })
    
    return state

async def progress_tracker_node(state: ResearchState):
    await state['send_event']("progress", state['progress'])
    await state['send_event']("status", state['status'])
    # # print(f"[ProgressTracker] {state['status']} ({state['progress']}%)")
    return {}

# ------------------------------------------------------------

def decide_paper(state: ResearchState) -> Literal["paper", "example", "domain_expert"]:
    with_paper = state.get("with_paper", False)
    with_example = state.get("with_example", False)
    if with_paper:
        return "paper"
    elif with_example:
        return "example"
    else:
        return "domain_expert"

def decide_draw(state: ResearchState) -> Literal["drawing", "persistence"]:
    is_drawing = state.get("is_drawing", False)
    if is_drawing:
        return "drawing"
    else:
        return "persistence"
    
# ------------------------------------------------------------
# Workflow Definition

def create_research_graph():
    workflow = StateGraph(ResearchState)
    
    # add nodes
    workflow.add_node("rag", rag_node)
    workflow.add_node("paper", paper_node)
    workflow.add_node("example", example_node)
    workflow.add_node("domain_expert", domain_expert_node)
    workflow.add_node("interdisciplinary", interdisciplinary_node)
    workflow.add_node("evaluation", evaluation_node)
    workflow.add_node("drawing", drawing_node)
    workflow.add_node("persistence", persistence_node)
    workflow.add_node("progress_tracker", progress_tracker_node)
    
    # define the workflow
    workflow.set_entry_point("rag")
    workflow.add_conditional_edges("rag", decide_paper)
    workflow.add_edge("paper", "domain_expert")
    workflow.add_edge("example", "domain_expert")
    workflow.add_edge("domain_expert", "interdisciplinary")
    workflow.add_edge("interdisciplinary", "evaluation")
    workflow.add_conditional_edges("evaluation", decide_draw)
    workflow.add_edge("drawing", "persistence")
    workflow.add_edge("persistence", END)
    
    # add parallel edges for progress tracking
    for node in ["rag", "paper", "example", "domain_expert", "interdisciplinary", "evaluation", "drawing"]:
        workflow.add_edge(node, "progress_tracker")
    
    return workflow.compile()

# ------------------------------------------------------------

async def start_research(
        current_user,
        query: str,
        query_analysis_result: Dict[str, Any],
        with_paper: bool,
        with_example: bool,
        is_drawing: bool,
        send_event: Callable[[str, Any], Awaitable[None]]
    ):
    BASE_URL = current_user.get('api_url') or "https://api.deepseek.com/v1"
    MODEL_NAME = current_user.get('model_name') or "deepseek-chat"
    API_KEY = current_user.get('api_key') or None

    model = init_chat_model(
        model=MODEL_NAME,
        model_provider="openai",
        api_key=API_KEY,
        base_url=BASE_URL,
        streaming=True
    )

    # Create initial state
    initial_state = {
        "model": model,
        "current_user": current_user,
        "send_event": send_event,
        "with_paper": with_paper,
        "with_example": with_example,
        "is_drawing": is_drawing,
        "query": query,
        "query_analysis_result": query_analysis_result,
        "progress": 0,
        "status": "Starting research workflow"
    }

    # Run the graph
    result = await graph.ainvoke(initial_state)
    # print("Final state:", result)

# -------------------------------------------------------------
# Compile

graph = create_research_graph()

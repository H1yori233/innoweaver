import json
from bson.objectid import ObjectId
from typing import List
from utils.redis import async_redis
from utils.db import (
    solutions_collection, papers_collection,
    solutions_liked_collection, papers_cited_collection
)

## Query #######################################################################

async def query_solution(solution_id):
    solution = await solutions_collection.find_one({
        '_id': ObjectId(solution_id)
    })
    if solution:
        solution['id'] = str(solution['_id'])
        solution['_id'] = str(solution['_id'])
        solution['user_id'] = str(solution['user_id'])
        return solution
    return None

async def query_liked_solution(user_id: str, solution_ids: List[str]):
    """
    Query whether user has liked the specified solution list
    """
    user_oid = ObjectId(user_id)
    solution_oids = [ObjectId(sid) for sid in solution_ids]
    cursor = solutions_liked_collection.find({
        'user_id': user_oid,
        'solution_id': {'$in': solution_oids}
    })
    
    # Use to_list to get all results
    liked_relations = await cursor.to_list(None)
    liked_solution_ids = {str(relation['solution_id']) for relation in liked_relations}
    result = [
        {
            'solution_id': sid,
            'isLiked': sid in liked_solution_ids
        }
        for sid in solution_ids
    ]
    
    return result

async def query_paper(paper_id: str):
    paper = None
    cache_key = f"paper:{paper_id}"
    cached_result = await async_redis.get(cache_key)
    if cached_result:
        paper = json.loads(cached_result)
    # Not in cache, read from database
    else:
        paper = await papers_collection.find_one({'_id': ObjectId(paper_id)})
        if(paper):
            paper['id'] = str(paper['_id'])
            del paper['_id']
    # Update to cache
    if(paper):
        await async_redis.setex(cache_key, 3600, json.dumps(paper))
    return paper

## Load ########################################################################

async def gallery(page: int = 1):
    items_per_page = 10
    skip = (page - 1) * items_per_page
    
    solutions = await solutions_collection.find().skip(skip).limit(items_per_page).to_list(None) 
    return [{
        "id": str(solution['_id']),
        "user_id": str(solution['user_id']),
        'query': solution['query'], 
        'solution': solution['solution'], 
        'timestamp': solution['timestamp']
    } for solution in solutions]
    
async def load_solutions(user_id: str, page: int = 1):
    items_per_page = 10
    skip = (page - 1) * items_per_page
    
    solutions = await solutions_collection.find(
        {'user_id': ObjectId(user_id)}
    ).skip(skip).limit(items_per_page).to_list(None)
    return [{
        "id": str(solution['_id']),
        "user_id": str(solution['user_id']),
        'query': solution['query'], 
        'solution': solution['solution'], 
        'timestamp': solution['timestamp']
    } for solution in solutions]

async def load_liked_solutions(user_id: str, page: int = 1):
    items_per_page = 10
    skip = (page - 1) * items_per_page
    
    relations = await solutions_liked_collection.find(
        {'user_id': ObjectId(user_id)}
    ).skip(skip).limit(items_per_page).to_list(None)
    result = []
    for relation in relations:
        id = str(relation['solution_id'])
        solution = await query_solution(id)
        result.append(solution)
    return result

async def load_paper_cited_by_solution(solution_id: str):
    relations = await papers_cited_collection.find(
        {'solution_id': ObjectId(solution_id)}
    ).to_list(None)
    return [str(relation['paper_id']) for relation in relations]

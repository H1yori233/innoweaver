import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from meilisearch_python_async import Client as AsyncMeiliClient

MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'papersDB'  
COLLECTION_NAME = 'papersCollection'

async def fetch_from_mongodb():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    documents = []
    async for doc in collection.find():
        doc['_id'] = str(doc['_id'])
        documents.append(doc)
    
    await client.close()
    return documents

async def insert_to_meilisearch(data):
    meili_client = AsyncMeiliClient('http://127.0.0.1:7700')
    index = await meili_client.get_index('paper_id')
    await index.add_documents(data)

async def main():
    mongo_data = await fetch_from_mongodb()
    await insert_to_meilisearch(mongo_data)

if __name__ == "__main__":
    asyncio.run(main())

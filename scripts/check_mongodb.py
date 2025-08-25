import asyncio
from utils.db import mongo_client, users_collection, solutions_collection

async def check_database():
    # Check connection
    try:
        await mongo_client.admin.command('ping')
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return
    
    # Check users collection
    users_count = await users_collection.count_documents({})
    print(f"users collection has {users_count} documents")
    
    # Show some users
    async for user in users_collection.find().limit(50):
        print(f"User example: {user}")
    
    # Check solutions collection
    solutions_count = await solutions_collection.count_documents({})
    print(f"solutions collection has {solutions_count} documents")

if __name__ == "__main__":
    asyncio.run(check_database()) 
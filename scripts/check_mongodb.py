import asyncio
from utils.db import mongo_client, users_collection, solutions_collection

async def check_database():
    # 检查连接
    try:
        await mongo_client.admin.command('ping')
        print("MongoDB 连接成功！")
    except Exception as e:
        print(f"MongoDB 连接失败: {e}")
        return
    
    # 检查用户集合
    users_count = await users_collection.count_documents({})
    print(f"users 集合中有 {users_count} 个文档")
    
    # 显示一些用户
    async for user in users_collection.find().limit(50):
        print(f"用户示例: {user}")
    
    # 检查解决方案集合
    solutions_count = await solutions_collection.count_documents({})
    print(f"solutions 集合中有 {solutions_count} 个文档")

if __name__ == "__main__":
    asyncio.run(check_database()) 
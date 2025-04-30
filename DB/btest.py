from pymongo import MongoClient
from bson.objectid import ObjectId

# 用户名和密码
username = "CHI2025"
password = "Inlab2024!"  # 替换为实际密码
host = "localhost"          # MongoDB 主机名
port = 27017                # MongoDB 端口号
auth_db = "admin"           # 认证数据库

# 假设你已经连接到 MongoDB
uri = f"mongodb://{username}:{password}@{host}:{port}/?authSource={auth_db}"
client = MongoClient(uri)

# 选择数据库
db = client['userDB']
solutions_collection = db['solutions']
papers_collection = client['papersDB']['papersCollection']
papers_cited_collection = db['paper_cited']

# 用户的ID (假设我们想分析一个特定用户的兴趣)
user_id = ObjectId("67226a38dec51d7a422cc095")

# 存储用户兴趣的领域、话题、作者和期刊
from utils.tasks.personas import generate_personas
user_interests = generate_personas(user_id)

# 输出用户兴趣分析结果
print("User Query:", user_interests['user_query'])
print("Keywords:", list(user_interests['keywords']))
print("Authors:", list(user_interests['authors']))
print("Journals:", list(user_interests['journals']))
print("Interest Topics:", list(user_interests['topics']))

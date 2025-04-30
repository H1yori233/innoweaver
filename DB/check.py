from pymongo import MongoClient

# 用户名和密码
username = "CHI2025"
password = "Inlab2024!"  # 替换为实际密码
# host = "localhost"          # MongoDB 主机名
host = "120.55.193.195"
port = 27017                # MongoDB 端口号
auth_db = "admin"           # 认证数据库

# 构造连接 URI
uri = f"mongodb://{username}:{password}@{host}:{port}/?authSource={auth_db}"

# 创建客户端
client = MongoClient(uri)

# 测试连接
try:
    db_list = client.list_database_names()
    print("Databases:", db_list)
except Exception as e:
    print("Error:", e)


# 选择或创建 user_management_db 数据库
db = client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

# 便于查询
# user_id, item_id, time
solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 列出所有数据库
db_list = client.list_database_names()
print("现有的 MongoDB 数据库：")
for db_name in db_list:
    print(f"- {db_name}")

users = users_collection.find()
print("")
print("")
print("userDB 中的用户列表：")
for user in users:
    print(user)  # 输出每个用户的文档

# user = users_collection.find_one()
# print("user:", user)

# papers = papers_collection.find_one()
# print("paper:", papers)

# print()
# solution = solutions_collection.find_one()
# print("solution: ", solution)

# print()
# cite = papers_cited_collection.find_one()
# print("cite: ", cite)

# def fix_cited_field():
#     # 修复所有非数值类型的 Cited 字段
#     papers_collection.update_many(
#         {'Cited': {'$not': {'$type': 'number'}}},
#         {'$set': {'Cited': 0}}
#     )
#     print("所有非数值类型的 Cited 字段已修复为 0")

# fix_cited_field()
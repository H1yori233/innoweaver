from meilisearch import Client
from pymongo import MongoClient
from bson.objectid import ObjectId

# 用户名和密码
username = "CHI2025"
password = "Inlab2024!"  # 替换为实际密码
host = "localhost"          # MongoDB 主机名
port = 27017                # MongoDB 端口号
auth_db = "admin"           # 认证数据库
uri = f"mongodb://{username}:{password}@{host}:{port}/?authSource={auth_db}"

client = MongoClient(uri)
db = client['userDB']
# users_collection = db['users']
# solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

# 创建客户端，无需提供 API 密钥
meili_client = Client('http://127.0.0.1:7700')

# 列出所有索引
indexes = meili_client.get_indexes()
# print("Indexes:", indexes)
# for index in indexes['results']:
    # print(f"Index UID: {index.uid}, Primary Key: {index.primary_key}")
    
meili_index = meili_client.index('paper_id')
limit = 100  # 每次获取的文档数量（根据需求调整）
offset = 1   # 起始偏移量

stats = meili_index.get_stats()
total_documents = stats.number_of_documents
print(f"Total documents to fetch: {total_documents}")

while offset < total_documents:
    print(f"\nFetching documents with offset {offset} and limit {limit}...")
    documents_results = meili_index.get_documents(parameters={"limit": limit, "offset": offset})

    # 检查是否有文档返回
    if not documents_results.results:
        break

    # 转换并导入到 MongoDB
    for doc in documents_results.results:
        # 提取核心文档内容
        doc_dict = doc._Document__doc
        try:
            # 转换 _id 为 ObjectId
            doc_dict['_id'] = ObjectId(doc_dict['_id'])
            # doc_dict['user_id'] = ObjectId(doc_dict['user_id'])
        except Exception as e:
            print(f"Invalid ObjectId for document {_id}: {doc_dict['_id']}. Skipping...")
            continue  # 跳过此文档
        
        # 打印文档内容
        print(f"\n文档内容：\n{doc_dict}")
        
        try:
            # 尝试插入文档
            papers_collection.insert_one(doc_dict)
            print("文档已成功插入 MongoDB。\n")
        except PyMongoError as e:
            # 捕获插入异常并显示错误信息
            print(f"插入失败，错误信息：{e}\n")

        # # 用户确认
        # user_input = input("是否插入此文档到 MongoDB? (Y/N): ").strip().upper()
        # if user_input == 'Y':
        #     try:
        #         # 尝试插入文档
        #         users_collection.insert_one(doc_dict)
        #         print("文档已成功插入 MongoDB。\n")
        #     except PyMongoError as e:
        #         # 捕获插入异常并显示错误信息
        #         print(f"插入失败，错误信息：{e}\n")
        # elif user_input == 'N':
        #     print("跳过此文档。\n")
        # else:
        #     print("无效输入，跳过此文档。\n")

    # 更新偏移量
    offset += limit

print("导入完成！")
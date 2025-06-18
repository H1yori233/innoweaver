import os
import json
from meilisearch import Client
from tqdm import tqdm
from pymongo import MongoClient
from utils.config import MONGODB

# 初始化 MongoDB 客户端
mongo_uri = f"mongodb://{MONGODB['username']}:{MONGODB['password']}@{MONGODB['host']}:{MONGODB['port']}/?authSource={MONGODB['auth_db']}"
mongo_client = MongoClient(mongo_uri)
papers_db = mongo_client['papersDB']
papers_collection = papers_db['papersCollection']

def batch_insert_json_to_meili(folder_path, index_name):
    # 初始化Meilisearch客户端（参考DB/meil.py第20-29行）
    meili_client = Client('http://127.0.0.1:7700')
    index = meili_client.index(index_name)
    
    # 获取所有JSON文件
    json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]
    
    success_count = 0
    error_files = []
    
    # 使用tqdm显示进度条
    with tqdm(total=len(json_files), desc="Processing JSON Files") as pbar:
        for filename in json_files:
            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    mongo_result = papers_collection.insert_one(data)
                    data['_id'] = str(mongo_result.inserted_id)
                    
                    # 插入文档（参考DB/solutions_to_meilisearch.py第59-60行）
                    info = index.add_documents([data])
                    # print(info)
                    
                success_count += 1
            except json.JSONDecodeError as e:
                error_files.append((filename, f"JSON解析错误: {str(e)}"))
            except Exception as e:
                error_files.append((filename, f"其他错误: {str(e)}"))
            finally:
                pbar.update(1)
    
    # 打印统计信息
    print(f"\n处理完成！成功: {success_count}/{len(json_files)}")
    if error_files:
        print("\n错误文件列表:")
        for f, err in error_files:
            print(f"- {f}: {err}")

if __name__ == "__main__":
    # 配置参数
    json_folder = "ACM_HCI0313/ACM_HCI0313/UIST"  # 替换为你的JSON文件夹路径
    index_name = "paper_id"          # 替换为你的索引名称
    
    batch_insert_json_to_meili(json_folder, index_name)
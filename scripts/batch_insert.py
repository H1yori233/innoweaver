import os
import json
from meilisearch import Client
from tqdm import tqdm
from pymongo import MongoClient
from utils.config import MONGODB

# Initialize MongoDB client
mongo_uri = f"mongodb://{MONGODB['username']}:{MONGODB['password']}@{MONGODB['host']}:{MONGODB['port']}/?authSource={MONGODB['auth_db']}"
mongo_client = MongoClient(mongo_uri)
papers_db = mongo_client['papersDB']
papers_collection = papers_db['papersCollection']

def batch_insert_json_to_meili(folder_path, index_name):
    # Initialize MeiliSearch client (reference DB/meil.py lines 20-29)
    meili_client = Client('http://127.0.0.1:7700')
    index = meili_client.index(index_name)
    
    # Get all JSON files
    json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]
    
    success_count = 0
    error_files = []
    
    # Use tqdm to display progress bar
    with tqdm(total=len(json_files), desc="Processing JSON Files") as pbar:
        for filename in json_files:
            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    mongo_result = papers_collection.insert_one(data)
                    data['_id'] = str(mongo_result.inserted_id)
                    
                    # Insert documents (reference DB/solutions_to_meilisearch.py lines 59-60)
                    info = index.add_documents([data])
                    # print(info)
                    
                success_count += 1
            except json.JSONDecodeError as e:
                error_files.append((filename, f"JSON parse error: {str(e)}"))
            except Exception as e:
                error_files.append((filename, f"Other error: {str(e)}"))
            finally:
                pbar.update(1)
    
    # Print statistics
    print(f"\nProcessing completed! Success: {success_count}/{len(json_files)}")
    if error_files:
        print("\nError files list:")
        for f, err in error_files:
            print(f"- {f}: {err}")

if __name__ == "__main__":
    # Configuration parameters
    json_folder = "ACM_HCI0313/ACM_HCI0313/UIST"  # Replace with your JSON folder path
    index_name = "paper_id"          # Replace with your index name
    
    batch_insert_json_to_meili(json_folder, index_name)
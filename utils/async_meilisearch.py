import httpx
import json
from typing import Dict, List, Any, Optional, Union
from utils.log import logger

class AsyncMeilisearchIndex:
    def __init__(self, client, index_uid):
        self.client = client
        self.index_uid = index_uid
        self.base_url = f"{client.base_url}/indexes/{index_uid}"

    async def add_documents(self, documents: List[Dict], primary_key: Optional[str] = None) -> Dict:
        """Asynchronously add documents to index"""
        try:
            url = f"{self.base_url}/documents"
            params = {}
            if primary_key:
                params["primaryKey"] = primary_key
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=documents,
                    params=params,
                    headers=self.client.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully added {len(documents)} documents to index {self.index_uid}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while adding documents to index {self.index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error adding documents to index {self.index_uid}: {str(e)}")
            raise

    async def delete_document(self, document_id: str) -> Dict:
        """Asynchronously delete documents"""
        try:
            url = f"{self.base_url}/documents/{document_id}"
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    url,
                    headers=self.client.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully deleted document {document_id} from index {self.index_uid}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while deleting document {document_id} from index {self.index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error deleting document {document_id} from index {self.index_uid}: {str(e)}")
            raise

    async def search(self, query: str, search_params: Optional[Dict] = None) -> Dict:
        """Asynchronously search documents"""
        try:
            url = f"{self.base_url}/search"
            payload = {"q": query}
            
            if search_params:
                payload.update(search_params)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self.client.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully searched index {self.index_uid} with query: {query}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while searching index {self.index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error searching index {self.index_uid}: {str(e)}")
            raise

class AsyncMeilisearchClient:
    def __init__(self, url: str, api_key: Optional[str] = None):
        self.base_url = url
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        logger.info(f"Initialized AsyncMeilisearchClient with base URL: {url}")

    def index(self, index_uid: str) -> AsyncMeilisearchIndex:
        """Get index instance"""
        logger.debug(f"Creating index instance for {index_uid}")
        return AsyncMeilisearchIndex(self, index_uid)

    async def create_index(self, index_uid: str, options: Optional[Dict] = None) -> Dict:
        """Asynchronously create index"""
        try:
            url = f"{self.base_url}/indexes"
            payload = {"uid": index_uid}
            
            if options:
                payload.update(options)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully created index: {index_uid}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while creating index {index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error creating index {index_uid}: {str(e)}")
            raise

    async def get_indexes(self) -> List[Dict]:
        """Asynchronously get all indexes"""
        try:
            url = f"{self.base_url}/indexes"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers
                )
                response.raise_for_status()
                logger.info("Successfully retrieved all indexes")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while getting indexes: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error getting indexes: {str(e)}")
            raise

    async def get_index(self, index_uid: str) -> Dict:
        """Asynchronously get specific index information"""
        try:
            url = f"{self.base_url}/indexes/{index_uid}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully retrieved index: {index_uid}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while getting index {index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error getting index {index_uid}: {str(e)}")
            raise

    async def delete_index(self, index_uid: str) -> Dict:
        """Asynchronously delete index"""
        try:
            url = f"{self.base_url}/indexes/{index_uid}"
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    url,
                    headers=self.headers
                )
                response.raise_for_status()
                logger.info(f"Successfully deleted index: {index_uid}")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while deleting index {index_uid}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error deleting index {index_uid}: {str(e)}")
            raise

    async def health(self) -> Dict:
        """Asynchronously check Meilisearch health status"""
        try:
            url = f"{self.base_url}/health"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers
                )
                response.raise_for_status()
                logger.info("Successfully checked Meilisearch health status")
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error while checking health status: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error checking health status: {str(e)}")
            raise 
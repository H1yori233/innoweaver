import os
import uuid
import httpx
from io import BytesIO
from PIL import Image

async def process_and_upload_image(image_url: str, sm_ms_api_key: str) -> tuple[str, str]:
    """处理并上传图片，返回 (url, image_name)"""
    # 下载图片
    async with httpx.AsyncClient() as client:
        response = await client.get(image_url)
        response.raise_for_status()
        image_data = response.content

    # 处理图片
    image = Image.open(BytesIO(image_data))
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # 生成唯一文件名
    image_name = str(uuid.uuid4())
    temp_image_path = f"./temp_image_{image_name}.jpg"
    
    try:
        # 保存临时文件
        image.save(temp_image_path, format='JPEG', optimize=True, quality=30)
        
        # 直接在这里上传到 SM.MS
        async with httpx.AsyncClient() as client:
            with open(temp_image_path, "rb") as image_file:
                response = await client.post(
                    "https://sm.ms/api/v2/upload",
                    headers={"Authorization": sm_ms_api_key},
                    files={"smfile": (f"{image_name}.jpg", image_file, "image/jpeg")}  # 指定文件名
                )
            response.raise_for_status()
            result = response.json()
            
            if result.get("success"):
                return result["data"]["url"], image_name
            else:
                raise Exception(f"SM.MS upload failed: {result.get('message')}")
            
    finally:
        # 清理临时文件
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path) 
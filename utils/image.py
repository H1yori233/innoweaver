import os
import uuid
import httpx
from io import BytesIO
from PIL import Image


async def process_and_upload_image(
    image_url: str, sm_ms_api_key: str
) -> tuple[str, str]:
    """Process and upload image, return (url, image_name)"""
    # Download image
    async with httpx.AsyncClient() as client:
        response = await client.get(image_url)
        response.raise_for_status()
        image_data = response.content

    # Process image
    image = Image.open(BytesIO(image_data))
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Generate unique filename
    image_name = str(uuid.uuid4())
    temp_image_path = f"./temp_image_{image_name}.jpg"

    try:
        # Save temporary file
        image.save(temp_image_path, format="JPEG", optimize=True, quality=30)

        # Upload directly to SM.MS here
        async with httpx.AsyncClient() as client:
            with open(temp_image_path, "rb") as image_file:
                response = await client.post(
                    "https://sm.ms/api/v2/upload",
                    headers={"Authorization": sm_ms_api_key},
                    files={
                        "smfile": (f"{image_name}.jpg", image_file, "image/jpeg")
                    },  # Specify filename
                )
            response.raise_for_status()
            result = response.json()

            if result.get("success"):
                return result["data"]["url"], image_name
            else:
                raise Exception(f"SM.MS upload failed: {result.get('message')}")

    finally:
        # Clean up temporary file
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)

from platforms.base import PlatformBase
from typing import Dict, Any
from loguru import logger
import asyncio

class Xiaohongshu(PlatformBase):
    """小红书平台"""
    
    async def login(self, username: str, password: str) -> bool:
        """小红书登录"""
        try:
            # 导航到登录页
            await self.browser.goto("https://www.xiaohongshu.com/login")
            await asyncio.sleep(2)
            
            # 切换到密码登录
            await self.wait_and_click(".login-type-tab > div:nth-child(2)", 5000)
            
            # 输入手机号和密码
            await self.wait_and_fill("input[placeholder='手机号']", username)
            await self.wait_and_fill("input[placeholder='密码']", password)
            
            # 点击登录
            await self.wait_and_click(".login-btn")
            
            # 等待登录完成
            await asyncio.sleep(3)
            
            # 检查是否需要验证
            if await self.browser.page.query_selector(".captcha-modal"):
                await self.handle_verification()
            
            # 检查登录状态
            if await self.browser.page.query_selector(".user-avatar"):
                logger.info("小红书登录成功")
                return True
            else:
                logger.error("小红书登录失败")
                return False
                
        except Exception as e:
            logger.error(f"小红书登录异常: {e}")
            return False
            
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布笔记到小红书"""
        try:
            # 导航到发布页面
            await self.browser.goto("https://creator.xiaohongshu.com/publish/publish")
            await asyncio.sleep(3)
            
            # 选择图文笔记
            await self.wait_and_click(".publish-type-item:nth-child(1)")
            await asyncio.sleep(2)
            
            # 上传图片（小红书必须有图片）
            if "images" in article and article["images"]:
                # 处理图片上传
                upload_btn = "input[type='file']"
                for image_path in article["images"]:
                    await self.browser.page.set_input_files(upload_btn, image_path)
                    await asyncio.sleep(2)
            else:
                logger.error("小红书必须包含至少一张图片")
                return False
            
            # 输入标题和内容
            title_input = "textarea[placeholder='填写标题会有更多赞哦']"
            await self.wait_and_fill(title_input, article.get("title", ""))
            
            content_input = "textarea[placeholder='添加正文']"
            await self.wait_and_fill(content_input, article.get("content", ""))
            
            # 添加话题标签
            if "tags" in article:
                for tag in article["tags"][:10]:  # 小红书最多10个标签
                    await self.browser.page.keyboard.type(f"#{tag} ")
                    await asyncio.sleep(0.5)
            
            # 选择发布设置
            await self.wait_and_click(".publish-setting")
            await asyncio.sleep(1)
            
            # 发布笔记
            await self.wait_and_click(".publish-btn")
            await asyncio.sleep(2)
            
            # 确认发布
            await self.wait_and_click(".confirm-publish-btn")
            
            logger.info("小红书笔记发布成功")
            return True
            
        except Exception as e:
            logger.error(f"小红书笔记发布失败: {e}")
            return False
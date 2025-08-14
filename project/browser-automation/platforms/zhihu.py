from platforms.base import PlatformBase
from typing import Dict, Any
from loguru import logger
import asyncio

class Zhihu(PlatformBase):
    """知乎平台"""
    
    async def login(self, username: str, password: str) -> bool:
        """知乎登录"""
        try:
            # 导航到登录页
            await self.browser.goto("https://www.zhihu.com/signin")
            await asyncio.sleep(2)
            
            # 切换到密码登录
            await self.wait_and_click(".SignFlow-tabs > div:nth-child(2)", 5000)
            
            # 输入用户名和密码
            await self.wait_and_fill("input[name='username']", username)
            await self.wait_and_fill("input[name='password']", password)
            
            # 点击登录
            await self.wait_and_click("button.SignFlow-submitButton")
            
            # 等待登录完成
            await asyncio.sleep(3)
            
            # 检查是否需要验证
            if await self.browser.page.query_selector(".Captcha"):
                await self.handle_verification()
            
            # 检查登录状态
            if await self.browser.page.query_selector(".AppHeader-User"):
                logger.info("知乎登录成功")
                return True
            else:
                logger.error("知乎登录失败")
                return False
                
        except Exception as e:
            logger.error(f"知乎登录异常: {e}")
            return False
            
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布文章到知乎"""
        try:
            # 导航到写文章页面
            await self.browser.goto("https://zhuanlan.zhihu.com/write")
            await asyncio.sleep(3)
            
            # 输入标题
            title_input = ".WriteIndex-titleInput > input"
            await self.wait_and_fill(title_input, article.get("title", ""))
            
            # 输入内容
            content_editor = ".public-DraftEditor-content"
            await self.browser.click(content_editor)
            await self.browser.page.keyboard.type(article.get("content", ""))
            
            # 设置话题标签
            if "tags" in article:
                await self.wait_and_click(".ContentItem-actions > button")
                await asyncio.sleep(1)
                for tag in article["tags"][:5]:
                    tag_input = "input[placeholder='搜索话题']"
                    await self.wait_and_fill(tag_input, tag)
                    await asyncio.sleep(1)
                    await self.browser.page.keyboard.press("Enter")
            
            # 发布文章
            await self.wait_and_click(".PublishPanel-stepOneButton")
            await asyncio.sleep(2)
            
            # 确认发布
            await self.wait_and_click(".PublishPanel-publishButton")
            
            logger.info("知乎文章发布成功")
            return True
            
        except Exception as e:
            logger.error(f"知乎文章发布失败: {e}")
            return False
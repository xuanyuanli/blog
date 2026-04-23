from platforms.base import PlatformBase
from typing import Dict, Any
from loguru import logger
import asyncio

class Juejin(PlatformBase):
    """掘金平台"""
    
    async def login(self, username: str, password: str) -> bool:
        """掘金登录"""
        try:
            # 导航到登录页
            await self.browser.goto("https://juejin.cn/login")
            await asyncio.sleep(2)
            
            # 切换到密码登录
            await self.wait_and_click(".other-login-box .clickable", 5000)
            
            # 输入手机号和密码
            await self.wait_and_fill("input[name='loginPhoneOrEmail']", username)
            await self.wait_and_fill("input[name='loginPassword']", password)
            
            # 点击登录
            await self.wait_and_click("button.login-button")
            
            # 等待登录完成
            await asyncio.sleep(3)
            
            # 检查登录状态
            if await self.browser.page.query_selector(".user-dropdown"):
                logger.info("掘金登录成功")
                return True
            else:
                logger.error("掘金登录失败")
                return False
                
        except Exception as e:
            logger.error(f"掘金登录异常: {e}")
            return False
            
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布文章到掘金"""
        try:
            # 导航到写文章页面
            await self.browser.goto("https://juejin.cn/editor/drafts/new?v=2")
            await asyncio.sleep(3)
            
            # 输入标题
            title_input = "input.title-input"
            await self.wait_and_fill(title_input, article.get("title", ""))
            
            # 输入内容
            content_editor = ".CodeMirror-scroll"
            await self.browser.click(content_editor)
            await self.browser.page.keyboard.type(article.get("content", ""))
            
            # 发布设置
            await self.wait_and_click(".publish-btn")
            await asyncio.sleep(2)
            
            # 选择分类
            if "category" in article:
                await self.wait_and_click(".category-list-box")
                await asyncio.sleep(1)
                # 选择具体分类（需要根据实际情况调整）
            
            # 添加标签
            if "tags" in article:
                for tag in article["tags"][:5]:
                    tag_input = "input[placeholder='请搜索添加标签']"
                    await self.wait_and_fill(tag_input, tag)
                    await asyncio.sleep(1)
                    await self.browser.page.keyboard.press("Enter")
            
            # 确认发布
            await self.wait_and_click(".submit-btn")
            
            logger.info("掘金文章发布成功")
            return True
            
        except Exception as e:
            logger.error(f"掘金文章发布失败: {e}")
            return False
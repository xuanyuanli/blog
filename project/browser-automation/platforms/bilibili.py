from platforms.base import PlatformBase
from typing import Dict, Any
from loguru import logger
import asyncio

class Bilibili(PlatformBase):
    """B站平台"""
    
    async def login(self, username: str, password: str) -> bool:
        """B站登录"""
        try:
            # 导航到登录页
            await self.browser.goto("https://passport.bilibili.com/login")
            await asyncio.sleep(2)
            
            # 输入用户名和密码
            await self.wait_and_fill("input[placeholder='请输入账号']", username)
            await self.wait_and_fill("input[placeholder='请输入密码']", password)
            
            # 点击登录
            await self.wait_and_click(".btn_primary")
            
            # 等待登录完成
            await asyncio.sleep(3)
            
            # 检查是否需要验证
            if await self.browser.page.query_selector(".geetest_panel"):
                await self.handle_verification()
            
            # 检查登录状态
            await self.browser.goto("https://www.bilibili.com")
            if await self.browser.page.query_selector(".header-avatar"):
                logger.info("B站登录成功")
                return True
            else:
                logger.error("B站登录失败")
                return False
                
        except Exception as e:
            logger.error(f"B站登录异常: {e}")
            return False
            
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布专栏文章到B站"""
        try:
            # 导航到专栏投稿页面
            await self.browser.goto("https://member.bilibili.com/platform/upload/text/apply")
            await asyncio.sleep(3)
            
            # 输入标题
            title_input = "input[placeholder='请输入标题']"
            await self.wait_and_fill(title_input, article.get("title", ""))
            
            # 切换到富文本编辑器
            await self.wait_and_click(".editor-toolbar .ql-formats:nth-child(1) button")
            
            # 输入内容
            content_editor = ".ql-editor"
            await self.browser.click(content_editor)
            await self.browser.page.keyboard.type(article.get("content", ""))
            
            # 设置分区
            if "category" in article:
                await self.wait_and_click(".category-select")
                await asyncio.sleep(1)
                # 选择具体分区（需要根据实际情况调整）
            
            # 设置标签
            if "tags" in article:
                tag_input = "input[placeholder='按回车键Enter创建标签']"
                for tag in article["tags"][:10]:  # B站最多10个标签
                    await self.wait_and_fill(tag_input, tag)
                    await self.browser.page.keyboard.press("Enter")
                    await asyncio.sleep(0.5)
            
            # 设置封面（如果有）
            if "cover" in article:
                # 上传封面逻辑
                pass
            
            # 发布文章
            await self.wait_and_click(".submit-btn")
            await asyncio.sleep(2)
            
            # 确认发布
            await self.wait_and_click(".confirm-btn")
            
            logger.info("B站文章发布成功")
            return True
            
        except Exception as e:
            logger.error(f"B站文章发布失败: {e}")
            return False
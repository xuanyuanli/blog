from platforms.base import PlatformBase
from typing import Dict, Any
from loguru import logger
import asyncio

class CSDN(PlatformBase):
    """CSDN平台"""
    
    async def login(self, username: str, password: str) -> bool:
        """CSDN登录"""
        try:
            # 导航到登录页
            await self.browser.goto("https://passport.csdn.net/login")
            await asyncio.sleep(2)
            
            # 切换到密码登录
            try:
                await self.wait_and_click("div.login-form-tab > span:nth-child(2)", 5000)
            except:
                logger.debug("已在密码登录模式")
            
            # 输入用户名和密码
            await self.wait_and_fill("input[name='all']", username)
            await self.wait_and_fill("input[name='pwd']", password)
            
            # 点击登录
            await self.wait_and_click("button[data-type='account']")
            
            # 等待登录完成
            await asyncio.sleep(3)
            
            # 检查是否有验证码
            if await self.browser.page.query_selector(".captcha-container"):
                await self.handle_verification()
            
            # 检查登录状态
            await self.browser.wait_for_navigation()
            current_url = self.browser.page.url
            if "passport" not in current_url:
                logger.info("CSDN登录成功")
                return True
            else:
                logger.error("CSDN登录失败")
                return False
                
        except Exception as e:
            logger.error(f"CSDN登录异常: {e}")
            return False
            
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布文章到CSDN"""
        try:
            # 导航到写文章页面
            await self.browser.goto("https://editor.csdn.net/md/")
            await asyncio.sleep(3)
            
            # 输入标题
            title_input = "input[placeholder='请输入文章标题（5～80个字）']"
            await self.wait_and_fill(title_input, article.get("title", ""))
            
            # 输入内容
            content_editor = ".editor-content-textarea > textarea"
            await self.wait_and_fill(content_editor, article.get("content", ""))
            
            # 设置标签
            if "tags" in article:
                tag_input = "input[placeholder='请输入标签']"
                for tag in article["tags"][:5]:  # CSDN最多5个标签
                    await self.wait_and_fill(tag_input, tag)
                    await self.browser.page.keyboard.press("Enter")
                    await asyncio.sleep(0.5)
            
            # 选择分类
            if "category" in article:
                await self.wait_and_click(".el-select")
                await asyncio.sleep(1)
                # 选择分类（需要根据实际情况调整）
                await self.browser.page.keyboard.type(article["category"])
                await self.browser.page.keyboard.press("Enter")
            
            # 发布文章
            await self.wait_and_click("button.btn-publish")
            await asyncio.sleep(2)
            
            # 确认发布
            await self.wait_and_click("button.el-button--primary")
            
            logger.info("CSDN文章发布成功")
            return True
            
        except Exception as e:
            logger.error(f"CSDN文章发布失败: {e}")
            return False
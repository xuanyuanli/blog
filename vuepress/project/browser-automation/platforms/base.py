from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from core.browser import BrowserManager
from loguru import logger
import asyncio

class PlatformBase(ABC):
    """平台基类"""
    
    def __init__(self, browser: BrowserManager):
        self.browser = browser
        self.platform_name = self.__class__.__name__
        
    @abstractmethod
    async def login(self, username: str, password: str) -> bool:
        """登录平台"""
        pass
        
    @abstractmethod
    async def publish_article(self, article: Dict[str, Any]) -> bool:
        """发布文章"""
        pass
        
    async def check_login_status(self) -> bool:
        """检查登录状态"""
        return False
        
    async def wait_and_click(self, selector: str, timeout: int = 30000):
        """等待元素并点击"""
        await self.browser.wait_for_selector(selector, timeout)
        await asyncio.sleep(0.5)  # 短暂等待
        await self.browser.click(selector)
        
    async def wait_and_fill(self, selector: str, text: str, timeout: int = 30000):
        """等待元素并填充"""
        await self.browser.wait_for_selector(selector, timeout)
        await asyncio.sleep(0.5)  # 短暂等待
        await self.browser.fill(selector, text)
        
    async def handle_verification(self):
        """处理验证码等验证"""
        logger.warning(f"{self.platform_name} 需要处理验证，请手动完成")
        await asyncio.sleep(30)  # 等待手动处理
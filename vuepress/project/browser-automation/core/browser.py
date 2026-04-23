from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from typing import Optional, Dict, Any
import asyncio
from pathlib import Path
from loguru import logger
from config import settings

class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
    async def __aenter__(self):
        await self.start()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        
    async def start(self, user_data_dir: Optional[str] = None):
        """启动浏览器"""
        try:
            self.playwright = await async_playwright().start()
            
            launch_options = {
                "headless": settings.headless,
                "slow_mo": settings.slow_mo,
                "args": [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--start-maximized'
                ]
            }
            
            self.browser = await self.playwright.chromium.launch(**launch_options)
            
            context_options = {
                "viewport": {"width": 1920, "height": 1080},
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            if user_data_dir:
                context_options["storage_state"] = user_data_dir
                
            self.context = await self.browser.new_context(**context_options)
            self.page = await self.context.new_page()
            
            # 添加反检测脚本
            await self.page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['zh-CN', 'zh', 'en']
                });
                window.chrome = {
                    runtime: {}
                };
                Object.defineProperty(navigator, 'permissions', {
                    get: () => ({
                        query: () => Promise.resolve({ state: 'granted' })
                    })
                });
            """)
            
            logger.info("浏览器启动成功")
            return self
            
        except Exception as e:
            logger.error(f"浏览器启动失败: {e}")
            raise
            
    async def close(self):
        """关闭浏览器"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("浏览器已关闭")
        except Exception as e:
            logger.error(f"浏览器关闭失败: {e}")
            
    async def goto(self, url: str, wait_until: str = "networkidle"):
        """导航到指定URL"""
        try:
            await self.page.goto(url, wait_until=wait_until, timeout=60000)
            logger.info(f"导航到: {url}")
        except Exception as e:
            logger.error(f"导航失败: {e}")
            raise
            
    async def wait_for_selector(self, selector: str, timeout: int = 30000):
        """等待元素出现"""
        try:
            await self.page.wait_for_selector(selector, timeout=timeout)
            logger.debug(f"元素已出现: {selector}")
        except Exception as e:
            logger.error(f"等待元素超时: {selector}")
            raise
            
    async def click(self, selector: str):
        """点击元素"""
        try:
            await self.page.click(selector)
            logger.debug(f"点击元素: {selector}")
        except Exception as e:
            logger.error(f"点击失败: {selector}")
            raise
            
    async def fill(self, selector: str, text: str):
        """填充表单"""
        try:
            await self.page.fill(selector, text)
            logger.debug(f"填充表单: {selector}")
        except Exception as e:
            logger.error(f"填充失败: {selector}")
            raise
            
    async def screenshot(self, filename: str = None):
        """截图"""
        try:
            if not filename:
                filename = f"{settings.screenshots_dir}/screenshot_{asyncio.get_event_loop().time()}.png"
            await self.page.screenshot(path=filename, full_page=True)
            logger.info(f"截图保存: {filename}")
            return filename
        except Exception as e:
            logger.error(f"截图失败: {e}")
            raise
            
    async def save_storage_state(self, path: str):
        """保存登录状态"""
        try:
            await self.context.storage_state(path=path)
            logger.info(f"登录状态已保存: {path}")
        except Exception as e:
            logger.error(f"保存登录状态失败: {e}")
            raise
            
    async def wait_for_navigation(self, timeout: int = 30000):
        """等待页面导航"""
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
        except Exception as e:
            logger.error(f"等待导航超时: {e}")
            raise
            
    async def evaluate(self, expression: str):
        """执行JavaScript"""
        try:
            return await self.page.evaluate(expression)
        except Exception as e:
            logger.error(f"执行JavaScript失败: {e}")
            raise
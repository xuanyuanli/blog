import asyncio
from typing import Dict, Any, List
from pathlib import Path
import json
from loguru import logger
from datetime import datetime

from core.browser import BrowserManager
from platforms.csdn import CSDN
from platforms.juejin import Juejin
from platforms.zhihu import Zhihu
from platforms.bilibili import Bilibili
from platforms.xiaohongshu import Xiaohongshu
from notifier.wecom import WeComNotifier
from config import settings

# 配置日志
logger.add(
    "logs/publish_{time}.log",
    rotation="1 day",
    retention="7 days",
    level="INFO"
)

class ArticlePublisher:
    """文章发布器"""
    
    def __init__(self):
        self.notifier = WeComNotifier()
        self.platforms = {
            "csdn": CSDN,
            "juejin": Juejin,
            "zhihu": Zhihu,
            "bilibili": Bilibili,
            "xiaohongshu": Xiaohongshu
        }
        
    async def publish_to_platform(self, platform_name: str, article: Dict[str, Any]) -> Dict[str, Any]:
        """发布到单个平台"""
        result = {
            "platform": platform_name,
            "status": "failed",
            "message": "",
            "url": None
        }
        
        try:
            # 获取平台配置
            username_key = f"{platform_name}_username"
            password_key = f"{platform_name}_password"
            username = getattr(settings, username_key, None)
            password = getattr(settings, password_key, None)
            
            if not username or not password:
                result["message"] = f"{platform_name}登录凭据未配置"
                logger.warning(result["message"])
                return result
            
            # 启动浏览器
            async with BrowserManager() as browser:
                # 创建平台实例
                platform_class = self.platforms.get(platform_name)
                if not platform_class:
                    result["message"] = f"不支持的平台: {platform_name}"
                    return result
                    
                platform = platform_class(browser)
                
                # 尝试加载已保存的登录状态
                storage_file = settings.user_data_dir / f"{platform_name}_storage.json"
                if storage_file.exists():
                    await browser.context.add_cookies(json.loads(storage_file.read_text()))
                    logger.info(f"已加载{platform_name}的登录状态")
                
                # 登录
                login_success = await platform.login(username, password)
                if not login_success:
                    result["message"] = "登录失败"
                    return result
                
                # 保存登录状态
                await browser.save_storage_state(str(storage_file))
                
                # 发布文章
                publish_success = await platform.publish_article(article)
                if publish_success:
                    result["status"] = "success"
                    result["message"] = "发布成功"
                    # 截图保存
                    screenshot_file = await browser.screenshot(
                        f"{settings.screenshots_dir}/{platform_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    )
                    result["screenshot"] = screenshot_file
                else:
                    result["message"] = "发布失败"
                    
        except Exception as e:
            result["message"] = f"异常: {str(e)}"
            logger.error(f"{platform_name}发布异常: {e}")
            
        return result
    
    async def publish_to_all(self, article: Dict[str, Any], platforms: List[str] = None) -> Dict[str, Dict[str, Any]]:
        """批量发布到多个平台"""
        if platforms is None:
            platforms = list(self.platforms.keys())
            
        results = {}
        tasks = []
        
        # 创建并发任务
        for platform in platforms:
            if platform in self.platforms:
                task = self.publish_to_platform(platform, article)
                tasks.append(task)
            else:
                logger.warning(f"跳过不支持的平台: {platform}")
        
        # 并发执行
        if tasks:
            completed_results = await asyncio.gather(*tasks)
            for result in completed_results:
                results[result["platform"]] = result
                # 发送单个平台的通知
                await asyncio.sleep(1)  # 避免通知过快
                self.notifier.send_article_publish_notification(
                    result["platform"],
                    article.get("title", "无标题"),
                    "success" if result["status"] == "success" else "failed",
                    result.get("url")
                )
        
        # 发送汇总报告
        self.notifier.send_batch_publish_report(results)
        
        return results

def load_article(file_path: str) -> Dict[str, Any]:
    """加载文章内容"""
    article_path = Path(file_path)
    
    if not article_path.exists():
        logger.error(f"文章文件不存在: {file_path}")
        return None
        
    if article_path.suffix == ".json":
        # JSON格式
        with open(article_path, "r", encoding="utf-8") as f:
            return json.load(f)
    elif article_path.suffix in [".md", ".txt"]:
        # Markdown或文本格式
        with open(article_path, "r", encoding="utf-8") as f:
            content = f.read()
            # 提取标题（第一行）
            lines = content.split("\n")
            title = lines[0].replace("#", "").strip() if lines else "无标题"
            return {
                "title": title,
                "content": content,
                "tags": [],  # 需要手动设置
                "category": ""  # 需要手动设置
            }
    else:
        logger.error(f"不支持的文件格式: {article_path.suffix}")
        return None

async def main():
    """主函数"""
    publisher = ArticlePublisher()
    
    # 示例文章
    article = {
        "title": "Python异步编程实战：使用Playwright实现浏览器自动化",
        "content": """# Python异步编程实战：使用Playwright实现浏览器自动化

## 简介
本文介绍如何使用Python的Playwright库实现浏览器自动化，包括网页登录、内容发布等功能。

## 核心特性
- 支持多浏览器（Chromium、Firefox、WebKit）
- 异步执行，性能优秀
- 自动等待元素加载
- 支持截图和录制

## 代码示例
```python
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://example.com")
        await browser.close()
```

## 总结
Playwright是一个强大的浏览器自动化工具，适合各种自动化场景。
""",
        "tags": ["Python", "Playwright", "自动化", "异步编程", "爬虫"],
        "category": "后端开发",
        "images": []  # 小红书需要图片
    }
    
    # 发布到指定平台
    # result = await publisher.publish_to_platform("csdn", article)
    # print(f"发布结果: {result}")
    
    # 批量发布
    # results = await publisher.publish_to_all(article, ["csdn", "juejin"])
    # for platform, result in results.items():
    #     print(f"{platform}: {result['message']}")
    
    logger.info("文章发布系统已就绪")
    print("""
    使用方法：
    1. 复制 .env.example 为 .env 并填写各平台登录凭据
    2. 准备文章内容（支持JSON、Markdown格式）
    3. 运行发布命令
    
    示例：
    - 发布到单个平台: await publisher.publish_to_platform("csdn", article)
    - 批量发布: await publisher.publish_to_all(article, ["csdn", "juejin"])
    """)

if __name__ == "__main__":
    asyncio.run(main())
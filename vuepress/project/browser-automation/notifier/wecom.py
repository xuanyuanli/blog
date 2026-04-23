import requests
from typing import Dict, Any, Optional
from loguru import logger
from config import settings
import json

class WeComNotifier:
    """企业微信机器人通知"""
    
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or settings.wecom_webhook_url
        if not self.webhook_url:
            logger.warning("企业微信webhook URL未配置")
    
    def send_text(self, content: str, mentioned_list: list = None, mentioned_mobile_list: list = None) -> bool:
        """发送文本消息"""
        if not self.webhook_url:
            logger.error("企业微信webhook URL未配置")
            return False
            
        data = {
            "msgtype": "text",
            "text": {
                "content": content
            }
        }
        
        if mentioned_list:
            data["text"]["mentioned_list"] = mentioned_list
        if mentioned_mobile_list:
            data["text"]["mentioned_mobile_list"] = mentioned_mobile_list
            
        return self._send(data)
    
    def send_markdown(self, content: str) -> bool:
        """发送Markdown消息"""
        if not self.webhook_url:
            logger.error("企业微信webhook URL未配置")
            return False
            
        data = {
            "msgtype": "markdown",
            "markdown": {
                "content": content
            }
        }
        
        return self._send(data)
    
    def send_article_publish_notification(self, platform: str, title: str, status: str, url: str = None) -> bool:
        """发送文章发布通知"""
        if status == "success":
            emoji = "✅"
            status_text = "成功"
            color = "info"
        else:
            emoji = "❌"
            status_text = "失败"
            color = "warning"
            
        content = f"""## {emoji} 文章发布{status_text}
        
**平台**: {platform}
**标题**: {title}
**状态**: {status_text}"""
        
        if url:
            content += f"\n**链接**: [{title}]({url})"
            
        return self.send_markdown(content)
    
    def send_batch_publish_report(self, results: Dict[str, Dict[str, Any]]) -> bool:
        """发送批量发布报告"""
        success_count = sum(1 for r in results.values() if r.get("status") == "success")
        fail_count = len(results) - success_count
        
        content = f"""## 📊 批量发布报告
        
**总计**: {len(results)}篇
**成功**: {success_count}篇
**失败**: {fail_count}篇

### 详细结果：
"""
        
        for platform, result in results.items():
            if result.get("status") == "success":
                emoji = "✅"
            else:
                emoji = "❌"
            content += f"\n- {emoji} **{platform}**: {result.get('message', '未知状态')}"
            if result.get("url"):
                content += f" - [查看]({result['url']})"
                
        return self.send_markdown(content)
    
    def _send(self, data: Dict[str, Any]) -> bool:
        """发送消息到企业微信"""
        try:
            headers = {"Content-Type": "application/json; charset=utf-8"}
            response = requests.post(
                self.webhook_url,
                headers=headers,
                data=json.dumps(data, ensure_ascii=False).encode('utf-8')
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("errcode") == 0:
                    logger.info("企业微信通知发送成功")
                    return True
                else:
                    logger.error(f"企业微信通知发送失败: {result.get('errmsg')}")
                    return False
            else:
                logger.error(f"企业微信通知发送失败: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"企业微信通知发送异常: {e}")
            return False
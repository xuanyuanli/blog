from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # CSDN
    csdn_username: Optional[str] = Field(default=None, env='CSDN_USERNAME')
    csdn_password: Optional[str] = Field(default=None, env='CSDN_PASSWORD')
    
    # 掘金
    juejin_username: Optional[str] = Field(default=None, env='JUEJIN_USERNAME')
    juejin_password: Optional[str] = Field(default=None, env='JUEJIN_PASSWORD')
    
    # 知乎
    zhihu_username: Optional[str] = Field(default=None, env='ZHIHU_USERNAME')
    zhihu_password: Optional[str] = Field(default=None, env='ZHIHU_PASSWORD')
    
    # B站
    bilibili_username: Optional[str] = Field(default=None, env='BILIBILI_USERNAME')
    bilibili_password: Optional[str] = Field(default=None, env='BILIBILI_PASSWORD')
    
    # 小红书
    xiaohongshu_username: Optional[str] = Field(default=None, env='XIAOHONGSHU_USERNAME')
    xiaohongshu_password: Optional[str] = Field(default=None, env='XIAOHONGSHU_PASSWORD')
    
    # 企业微信
    wecom_webhook_url: Optional[str] = Field(default=None, env='WECOM_WEBHOOK_URL')
    
    # 浏览器设置
    headless: bool = Field(default=False, env='HEADLESS')
    slow_mo: int = Field(default=100, env='SLOW_MO')
    
    # 项目路径
    project_root: Path = Path(__file__).parent
    screenshots_dir: Path = project_root / "screenshots"
    articles_dir: Path = project_root / "articles"
    user_data_dir: Path = project_root / "user_data"
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 创建必要的目录
        self.screenshots_dir.mkdir(exist_ok=True)
        self.articles_dir.mkdir(exist_ok=True)
        self.user_data_dir.mkdir(exist_ok=True)

settings = Settings()
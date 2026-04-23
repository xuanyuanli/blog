# 浏览器自动化文章发布系统

一个基于 Python + Playwright 的多平台文章自动发布系统，支持 CSDN、掘金、知乎、B站、小红书等主流技术平台的自动登录和文章发布，并集成企业微信通知功能。

## 功能特性

- ✅ **多平台支持**：CSDN、掘金、知乎、B站、小红书
- ✅ **自动登录**：支持账号密码登录，自动保存登录状态
- ✅ **批量发布**：一键发布到多个平台
- ✅ **异步并发**：基于异步编程，支持并发发布
- ✅ **消息通知**：企业微信机器人实时通知发布状态
- ✅ **反检测机制**：内置反自动化检测策略
- ✅ **错误处理**：完善的错误处理和日志记录

## 项目结构

```
browser-automation/
├── core/                    # 核心模块
│   ├── __init__.py
│   └── browser.py          # 浏览器管理器
├── platforms/              # 平台实现
│   ├── __init__.py
│   ├── base.py            # 平台基类
│   ├── csdn.py            # CSDN平台
│   ├── juejin.py          # 掘金平台
│   ├── zhihu.py           # 知乎平台
│   ├── bilibili.py        # B站平台
│   └── xiaohongshu.py     # 小红书平台
├── notifier/              # 通知模块
│   ├── __init__.py
│   └── wecom.py           # 企业微信通知
├── articles/              # 文章存储
│   └── example.json       # 示例文章
├── screenshots/           # 截图存储
├── user_data/            # 用户数据（登录状态等）
├── logs/                 # 日志文件
├── config.py             # 配置管理
├── main.py               # 主程序
├── requirements.txt      # 依赖列表
├── .env.example         # 环境变量示例
├── .gitignore           # Git忽略文件
└── README.md            # 项目说明

```

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装浏览器驱动
playwright install chromium
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写各平台的登录凭据：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# CSDN
CSDN_USERNAME=your_csdn_username
CSDN_PASSWORD=your_csdn_password

# 掘金
JUEJIN_USERNAME=your_juejin_phone
JUEJIN_PASSWORD=your_juejin_password

# 知乎
ZHIHU_USERNAME=your_zhihu_username
ZHIHU_PASSWORD=your_zhihu_password

# B站
BILIBILI_USERNAME=your_bilibili_username
BILIBILI_PASSWORD=your_bilibili_password

# 小红书
XIAOHONGSHU_USERNAME=your_xiaohongshu_phone
XIAOHONGSHU_PASSWORD=your_xiaohongshu_password

# 企业微信机器人
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your_key

# 浏览器设置
HEADLESS=false  # 是否无头模式
SLOW_MO=100     # 操作延迟（毫秒）
```

### 3. 准备文章内容

支持两种格式：

#### JSON格式（推荐）
```json
{
  "title": "文章标题",
  "content": "文章内容（支持Markdown）",
  "tags": ["标签1", "标签2"],
  "category": "分类",
  "images": ["image1.jpg", "image2.jpg"]  // 小红书必需
}
```

#### Markdown格式
```markdown
# 文章标题

文章内容...
```

### 4. 运行程序

```python
import asyncio
from main import ArticlePublisher, load_article

async def publish():
    publisher = ArticlePublisher()
    
    # 加载文章
    article = load_article("articles/example.json")
    
    # 发布到单个平台
    result = await publisher.publish_to_platform("csdn", article)
    print(f"CSDN发布结果: {result}")
    
    # 批量发布到多个平台
    results = await publisher.publish_to_all(
        article, 
        ["csdn", "juejin", "zhihu"]
    )
    for platform, result in results.items():
        print(f"{platform}: {result['message']}")

# 运行
asyncio.run(publish())
```

## 使用示例

### 发布到单个平台

```python
import asyncio
from main import ArticlePublisher

async def main():
    publisher = ArticlePublisher()
    
    article = {
        "title": "Python异步编程实战",
        "content": "文章内容...",
        "tags": ["Python", "异步编程"],
        "category": "后端开发"
    }
    
    result = await publisher.publish_to_platform("csdn", article)
    print(result)

asyncio.run(main())
```

### 批量发布

```python
import asyncio
from main import ArticlePublisher

async def main():
    publisher = ArticlePublisher()
    
    article = {
        "title": "技术分享",
        "content": "内容...",
        "tags": ["技术"],
        "category": "编程"
    }
    
    # 发布到所有配置的平台
    results = await publisher.publish_to_all(article)
    
    # 或指定平台
    results = await publisher.publish_to_all(
        article,
        ["csdn", "juejin"]
    )

asyncio.run(main())
```

### 从文件加载文章

```python
from main import load_article, ArticlePublisher

article = load_article("articles/my_article.json")
# 或
article = load_article("articles/my_article.md")
```

## 注意事项

### 登录相关
1. **首次登录**：首次登录可能需要手动处理验证码
2. **登录状态**：登录状态会自动保存，下次运行时自动加载
3. **多账号**：支持不同平台使用不同账号

### 发布相关
1. **小红书**：必须包含至少一张图片
2. **标签数量**：不同平台标签数量限制不同（CSDN: 5个, B站: 10个）
3. **内容格式**：建议使用Markdown格式，自动适配各平台

### 安全建议
1. **敏感信息**：不要将 `.env` 文件提交到版本控制
2. **登录凭据**：定期更新密码，使用专用账号
3. **频率控制**：避免过于频繁的发布，可能触发平台限制

## 故障排除

### 常见问题

1. **浏览器启动失败**
   ```bash
   playwright install chromium
   ```

2. **登录失败**
   - 检查账号密码是否正确
   - 某些平台可能需要手动处理验证
   - 检查网络连接

3. **发布失败**
   - 检查文章格式是否正确
   - 确认平台是否有特殊要求（如小红书需要图片）
   - 查看日志文件获取详细错误信息

### 日志查看

日志文件位于 `logs/` 目录：
```bash
tail -f logs/publish_*.log
```

## 扩展开发

### 添加新平台

1. 在 `platforms/` 目录创建新平台文件
2. 继承 `PlatformBase` 类
3. 实现 `login` 和 `publish_article` 方法
4. 在 `main.py` 中注册新平台

```python
# platforms/newplatform.py
from platforms.base import PlatformBase

class NewPlatform(PlatformBase):
    async def login(self, username, password):
        # 实现登录逻辑
        pass
    
    async def publish_article(self, article):
        # 实现发布逻辑
        pass
```

### 添加新通知方式

1. 在 `notifier/` 目录创建新通知类
2. 实现通知发送方法
3. 在主程序中使用

## 依赖说明

- **playwright**: 浏览器自动化核心库
- **python-dotenv**: 环境变量管理
- **requests**: HTTP请求（用于企微通知）
- **pydantic**: 配置验证和管理
- **loguru**: 日志记录

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 免责声明

本项目仅供学习和研究使用，请遵守各平台的服务条款和使用规范。使用本项目产生的任何后果由使用者自行承担。
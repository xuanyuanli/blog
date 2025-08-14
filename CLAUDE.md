# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

## 项目概述

这是一个基于 VuePress 和 vdoing 主题构建的技术博客。博客包含后端开发（Java、Spring）、前端开发（JavaScript、HTML/CSS）、系统架构和各种编程主题的文章。

项目包含两个主要部分：
1. 根目录下基于 VuePress 的博客站点
2. `project/spring-jdk17-demo/` 目录下的 Spring Boot 示例项目

## 架构说明

### 博客结构
- **docs/** - 所有博客内容和 VuePress 配置
  - **01.后端/** - 后端开发文章（Java、Spring、JVM 等）
  - **02.前端/** - 前端开发文章（JavaScript、HTML/CSS）
  - **03.架构/** - 架构文章（分布式系统、安全、中间件）
  - **.vuepress/** - VuePress 配置和主题自定义
    - **config.ts** - 主配置文件
    - **public/** - 静态资源
    - **styles/** - 自定义样式

- **utils/** - 博客管理工具脚本
  - **baiduPush.mjs** - 百度 SEO 推送
  - **editFrontmatter.mjs** - 批量编辑 markdown 元数据
  - **ftpSync.mjs** - FTP 部署工具

### 关键技术栈
- **博客平台**: VuePress 1.9.10 配合 vdoing 主题
- **Node 版本**: 18.x（在 package.json 中指定）
- **Spring Boot 示例**: Java 17, Spring Boot 3.4.2
- **构建工具**: 博客使用 npm，Spring 项目使用 Maven


### 内容管理
文章按类别组织，使用数字前缀进行排序。每个 markdown 文件包含用于分类和导航的 frontmatter 元数据。vdoing 主题会根据目录结构自动生成侧边栏和导航。

## 开发规则
- 主要语言为中文
- 优化文章的时候，对于关键字或短的code代码，请使用 ` 包裹
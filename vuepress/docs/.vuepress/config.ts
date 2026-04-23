/**
 * 提示：如您想使用JS版本的配置文件可参考：https://github.com/xugaoyi/vuepress-theme-vdoing/tree/a2f03e993dd2f2a3afdc57cf72adfc6f1b6b0c32/docs/.vuepress
 */
import {defineConfig4CustomTheme, UserPlugins} from 'vuepress/config'
import {VdoingThemeConfig} from 'vuepress-theme-vdoing/types'
// @ts-ignore
import dayjs from 'dayjs'
import htmlModules from './config/htmlModules' // 自定义插入的html块


// @ts-ignore
export default defineConfig4CustomTheme<VdoingThemeConfig>({
    theme: 'vdoing', // 使用npm主题包
    port: 9090,
    // theme: resolve(__dirname, '../../vdoing'), // 使用本地主题包

    locales: {
        '/': {
            lang: 'zh-CN',
            title: "轩辕李的博客",
            description: '轩辕李的技术博客,自我成长，变得更强',
        }
    },
    // @ts-ignore
    base: '/', // 默认'/'。如果你想将你的网站部署到如 https://foo.github.io/bar/，那么 base 应该被设置成 "/bar/",（否则页面将失去样式等文件）

    // 主题配置
    themeConfig: {
        // 导航配置
        nav: [
            {text: '首页', link: '/'},
            {
                text: '后端',
                link: '/server/', //目录页链接，此处link是vdoing主题新增的配置项，有二级导航时，可以点击一级导航跳到目录页
                items: [
                    // 说明：以下所有link的值只是在相应md文件头部定义的永久链接（不是什么特殊编码）。另外，注意结尾是有斜杠的
                    {text: 'Java', link: '/server/java/'},
                    {text: 'Spring', link: '/server/spring/'},
                    {text: '其他语言', link: '/server/otherLanguage/'},
                    {text: '工具', link: '/server/util/'},
                ],
            },
            {
                text: '前端',
                link: '/web/',
                items: [
                    {text: 'JavaScript', link: '/web/js/'},
                    {text: 'TypeScript', link: '/web/ts/'},
                    {text: 'Node.js', link: '/web/node/'},
                    {text: '前端框架', link: '/web/framework/'},
                    {text: '前端工程化', link: '/web/engineering/'},
                    {text: '浏览器与Web API', link: '/web/browser/'},
                ],
            },
            {
                text: '架构',
                link: '/framework/',
                items: [
                    {text: '架构设计与模式', link: '/framework/distribution/'},
                    {text: '代码质量管理', link: '/framework/codeQuality/'},
                    {text: '基础', link: '/framework/base/'},
                    {text: '操作系统', link: '/framework/os/'},
                    {text: '计算机网络', link: '/framework/network/'},
                    {text: '编程范式', link: '/framework/programmingParadigm/'},
                    {text: '安全', link: '/framework/security/'},
                    {text: '中间件', link: '/framework/middlewire/'},
                    {text: '心得', link: '/framework/think/'},
                ],
            },
            {text: '关于', link: '/about/'},
            {
                text: '索引',
                link: '/archives/',
                items: [
                    {text: '分类', link: '/categories/'},
                    {text: '标签', link: '/tags/'},
                    {text: '归档', link: '/archives/'},
                ],
            },
        ],
        sidebarDepth: 2, // 侧边栏显示深度，默认1，最大2（显示到h3标题）
        logo: '/img/logo-35.png', // 导航栏logo
        repo: 'xuanyuanli/blog', // 导航栏右侧生成Github链接
        searchMaxSuggestions: 10, // 搜索结果显示最大数
        lastUpdated: '上次更新', // 开启更新时间，并配置前缀文字   string | boolean (取值为git提交时间)
        docsDir: 'docs', // 编辑的文件夹
        docsBranch: 'main', // 编辑的文件所在分支，默认master。 注意：如果你的分支是main则修改为main
        editLinks: true, // 启用编辑
        editLinkText: '编辑',

        //*** 以下是Vdoing主题相关配置，文档：https://doc.xugaoyi.com/pages/a20ce8/ ***//

        // category: false, // 是否打开分类功能，默认true
        // tag: false, // 是否打开标签功能，默认true
        // archive: false, // 是否打开归档功能，默认true
        // categoryText: '随笔', // 碎片化文章（_posts文件夹的文章）预设生成的分类值，默认'随笔'

        // pageStyle: 'line', // 页面风格，可选值：'card'卡片 | 'line' 线（未设置bodyBgImg时才生效）， 默认'card'。 说明：card时背景显示灰色衬托出卡片样式，line时背景显示纯色，并且部分模块带线条边框

        // bodyBgImg: [
        //   'https://fastly.jsdelivr.net/gh/xugaoyi/image_store/blog/20200507175828.jpeg',
        //   'https://fastly.jsdelivr.net/gh/xugaoyi/image_store/blog/20200507175845.jpeg',
        //   'https://fastly.jsdelivr.net/gh/xugaoyi/image_store/blog/20200507175846.jpeg'
        // ], // body背景大图，默认无。 单张图片 String | 多张图片 Array, 多张图片时隔bodyBgImgInterval切换一张。
        // bodyBgImgOpacity: 0.5, // body背景图透明度，选值 0.1~1.0, 默认0.5
        // bodyBgImgInterval: 15, // body多张背景图时的切换间隔, 默认15，单位s
        // titleBadge: false, // 文章标题前的图标是否显示，默认true
        // titleBadgeIcons: [ // 文章标题前图标的地址，默认主题内置图标
        //   '图标地址1',
        //   '图标地址2'
        // ],
        // contentBgStyle: 1, // 文章内容块的背景风格，默认无. 1 方格 | 2 横线 | 3 竖线 | 4 左斜线 | 5 右斜线 | 6 点状

        // updateBar: { // 最近更新栏
        //   showToArticle: false, // 显示到文章页底部，默认true
        //   moreArticle: '/archives' // “更多文章”跳转的页面，默认'/archives'
        // },
        // rightMenuBar: false, // 是否显示右侧文章大纲栏，默认true (屏宽小于1300px下无论如何都不显示)
        // sidebarOpen: false, // 初始状态是否打开左侧边栏，默认true
        // pageButton: false, // 是否显示快捷翻页按钮，默认true

        // 默认外观模式（用户未在页面手动修改过模式时才生效，否则以用户设置的模式为准），可选：'auto' | 'light' | 'dark' | 'read'，默认'auto'。
        // defaultMode: 'auto',

        // 侧边栏  'structuring' | { mode: 'structuring', collapsable: Boolean} | 'auto' | <自定义>    温馨提示：目录页数据依赖于结构化的侧边栏数据，如果你不设置为'structuring',将无法使用目录页
        sidebar: 'structuring',

        // 文章默认的作者信息，(可在md文件中单独配置此信息) string | {name: string, link?: string}
        author: {
            name: '轩辕李', // 必需
            link: 'https://github.com/xuanyuanli', // 可选的
        },

        // 博主信息 (显示在首页侧边栏)
        blogger: {
            avatar: 'https://cdn.jsdelivr.net/gh/xuanyuanli/Img@master/picx/logo-460.1cne90qt8wu8.jpg',
            name: '轩辕李',
            slogan: '勇猛精进，星辰大海',
        },

        // 社交图标 (显示于博主信息栏和页脚栏。内置图标：https://doc.xugaoyi.com/pages/a20ce8/#social)
        social: {
            // iconfontCssFile: '//at.alicdn.com/t/xxx.css', // 可选，阿里图标库在线css文件地址，对于主题没有的图标可自己添加。阿里图片库：https://www.iconfont.cn/
            icons: [
                {
                    iconClass: 'icon-youjian',
                    title: '发邮件',
                    link: 'mailto:xuanyuanli999@gmail.com',
                },
                {
                    iconClass: 'icon-github',
                    title: 'GitHub',
                    link: 'https://github.com/xuanyuanli',
                }
            ],
        },

        // 页脚信息
        footer: {
            createYear: 2018, // 博客创建年份
            copyrightInfo:
                '<a href="http://beian.miit.gov.cn/" target="_blank">京ICP备2021021832号-2</a> | <a href="https://github.com/xuanyuanli/blob/master/LICENSE" target="_blank">MIT License</a>', // 博客版权信息，支持a标签或换行标签</br>
        },

        // 扩展自动生成frontmatter。（当md文件的frontmatter不存在相应的字段时将自动添加。不会覆盖已有的数据。）
        extendFrontmatter: {
            author: {
                name: '轩辕李',
                link: 'https://github.com/xuanyuanli'
            }
        },

        // 自定义hmtl(广告)模块
        htmlModules
    },

    // 注入到页面<head>中的标签，格式[tagName, { attrName: attrValue }, innerHTML?]
    head: [
        ['link', {rel: 'icon', href: '/img/favicon.ico'}], //favicons，资源放在public文件夹
        [
            'meta',
            {
                name: 'keywords',
                content: '个人技术博客,前端,后端,运维,技术文档,JavaScript,js,java',
            },
        ],
        ['meta', {name: 'baidu-site-verification', content: '7F55weZDDc'}],
        ['meta', {name: 'theme-color', content: '#11a8cd'}], // 移动浏览器主题颜色
    ],


    // 插件配置
    plugins: <UserPlugins>[

        //'vuepress-plugin-baidu-autopush', // 百度自动推送
        [
            'vuepress-plugin-mermaidjs',
            {},
        ],
        [
            'vuepress-plugin-flowchart',
            {},
        ],
        [
            'vuepress-plugin-baidu-tongji', // 百度统计
            {
                hm: '31b818a73b8dd8d2f51d66b25da84ead',
            },
        ],

        // 全文搜索。 ⚠️注意：此插件会在打开网站时多加载部分js文件用于搜索，导致初次访问网站变慢。如在意初次访问速度的话可以不使用此插件！（推荐：vuepress-plugin-thirdparty-search）
        // 'fulltext-search',

        // 可以添加第三方搜索链接的搜索框（继承原官方搜索框的配置参数）
        [
            'thirdparty-search',
            {
                thirdparty: [
                    {
                        title: '在Google中搜索本站的',
                        frontUrl: 'https://www.google.com/search?q=site%3Axuanyuanli.cn%20', // 搜索链接的前面部分
                        behindUrl: '', // 搜索链接的后面部分，可选，默认 ''
                    },
                    {
                        title: '在Bing中搜索本站的',
                        frontUrl: 'https://cn.bing.com/search?q=site%3Axuanyuanli.cn%20',
                    },
                    {
                        title: '通过百度搜索本站的',
                        frontUrl: 'https://www.baidu.com/s?wd=site%3Axuanyuanli.cn%20',
                    },
                ],
            }
        ],

        [
            'one-click-copy', // 代码块复制按钮
            {
                copySelector: ['div[class*="language-"] pre', 'div[class*="aside-code"] aside'], // String or Array
                copyMessage: '复制成功', // default is 'Copy successfully and then paste it for use.'
                duration: 1000, // prompt message display time.
                showInMobile: false, // whether to display on the mobile side, default: false.
            },
        ],
        [
            'demo-block', // demo演示模块 https://github.com/xiguaxigua/vuepress-plugin-demo-block
            {
                settings: {
                    // jsLib: ['http://xxx'], // 在线示例(jsfiddle, codepen)中的js依赖
                    // cssLib: ['http://xxx'], // 在线示例中的css依赖
                    // vue: 'https://fastly.jsdelivr.net/npm/vue/dist/vue.min.js', // 在线示例中的vue依赖
                    jsfiddle: false, // 是否显示 jsfiddle 链接
                    codepen: true, // 是否显示 codepen 链接
                    horizontal: false, // 是否展示为横向样式
                },
            },
        ],
        // [
        //     'demo-container', // demo演示模块
        //     {},
        // ],
        [
            'vuepress-plugin-zooming', // 放大图片
            {
                selector: '.theme-vdoing-content img:not(.no-zoom)', // 排除class是no-zoom的图片
                delay: 300,
                options: {
                    margin: 24,
                    background: '#25272A',
                    scrollOffset: 0,
                },
            },
        ],
        [
            'vuepress-plugin-comment', // 评论
            {
                choosen: 'gitalk',
                options: {
                    clientID: 'f12e2c3504d2492490b9',
                    clientSecret: '7d6f8ab9213ece57a5cb28f26abbd0cc9653c4f4',
                    repo: 'blog-gitalk-comment', // GitHub 仓库
                    owner: 'xuanyuanli', // GitHub仓库所有者
                    admin: ['xuanyuanli'], // 对仓库有写权限的人
                    // distractionFreeMode: true,
                    pagerDirection: 'last', // 'first'正序 | 'last'倒序
                    id: '<%- (frontmatter.permalink || frontmatter.to.path).slice(-16) %>', //  页面的唯一标识,长度不能超过50
                    title: '「评论」<%- frontmatter.title %>', // GitHub issue 的标题
                    labels: ['Gitalk', 'Comment'], // GitHub issue 的标签
                    body:
                        '页面：<%- window.location.origin + (frontmatter.to.path || window.location.pathname) %>', // GitHub issue 的内容
                },
            },
        ],
        [
            '@vuepress/last-updated', // "上次更新"时间格式
            {
                transformer: (timestamp, lang) => {
                    return dayjs(timestamp).format('YYYY/MM/DD')
                },
            },
        ],
        [
            "sitemap",
            {
                // 配置选项
                "hostname": "https://www.xuanyuanli.cn"
            },
        ],
        [
            'autometa',
            {
                canonical_base: 'https://www.xuanyuanli.cn',
            }
        ],
        require('./plugins/vuepress-plugin-jsonld'),
        [
            require('./plugins/vuepress-plugin-wxshare'),
            {
                serverUrl: 'https://www.xuanyuanli.cn/wechat/jsSdkConfig',
                host: 'https://www.xuanyuanli.cn',
                debug: false
            }
        ]
    ],

    markdown: {
        lineNumbers: false,
        extractHeaders: ['h2', 'h3', 'h4', 'h5', 'h6'], // 提取标题到侧边栏的级别，默认['h2', 'h3']
        // @ts-ignore
        externalLinks: {target: '_blank', rel: 'noopener noreferrer nofollow'}
    },

    // 监听文件变化并重新构建
    extraWatchFiles: [
        '.vuepress/config.ts',
        '.vuepress/config/htmlModules.ts',
    ],
})
export default ({
    Vue, // VuePress 正在使用的 Vue 构造函数
    options, // 附加到根实例的一些选项
    router, // 当前应用的路由实例
    siteData, // 站点元数据
    isServer // 当前应用配置是处于 服务端渲染 或 客户端
}) => {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        window.wx = window.wx || {};
        (function() {
            var hm = document.createElement("script")
            hm.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js"
            var s = document.getElementsByTagName("script")[0]
            s.parentNode.insertBefore(hm, s)
        })()
    }
};


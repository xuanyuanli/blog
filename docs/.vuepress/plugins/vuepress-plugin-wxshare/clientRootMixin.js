export default {
    watch: {
        '$page.path': {
            handler() {
                this.wxshare();
            }
        }
    },
    mounted() {
        if (typeof navigator === 'undefined') {
            return
        }
        console.log('vuepress-plugin-wxshare mounted')
        // 如果是ios系统浏览器，则保存入口url。参考这篇文章：https://segmentfault.com/a/1190000017870058
        if (this.inIos()) {
            window.localStorage.setItem('iosEntryUrl', this.url())
        }
        this.loadWeixinScript()
    },
    methods: {
        loadWeixinScript() {
            if (!this.inWx()) {
                return
            }
            const script = document.createElement('script');
            script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
            script.onload = () => {
                // 在脚本加载完成后执行操作
                this.wxshare();
            };
            document.head.appendChild(script);
        },
        inWx() {
            return /micromessenger/i.test(navigator.userAgent.toLowerCase())
        },
        inIos() {
            return navigator.userAgent.indexOf('iPhone') !== -1
        },
        url() {
            return (this.$frontmatter.host || OPTIONS.host) + this.$page.path
        },
        wxshare() {
            // 非微信浏览器不执行
            if (typeof navigator === 'undefined' || !this.inWx()) {
                return
            }
            let page = {
                title: this.$page.title,
                desc: this.$frontmatter.desc || this.$site.title || OPTIONS.desc,
                url: this.url(),
                imgUrl: this.$themeConfig.blogger.avatar || OPTIONS.defaultImg
            }
            if (this.inIos() && iosEntryUrl) {
                page.url = iosEntryUrl
            }
            fetch(OPTIONS.serverUrl + "?url=" + page.url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                }
            }).then(res => {
                wx.config({
                    debug: false, // 开启调试模式,
                    appId: res.appId, // 必填，企业号的唯一标识，此处填写企业号corpid
                    timestamp: res.timestamp, // 必填，生成签名的时间戳
                    nonceStr: res.nonceStr, // 必填，生成签名的随机串
                    signature: res.signature, // 必填，签名，见附录1
                    jsApiList: ['updateTimelineShareData', 'updateAppMessageShareData'], // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                })
                wx.ready(() => {
                    wx.updateAppMessageShareData({
                        title: page.title || "",
                        desc: page.desc || "",
                        link: page.url,
                        imgUrl: page.imgUrl || "",
                    });
                    wx.updateTimelineShareData({
                        title: page.title || "",
                        desc: page.desc || "",
                        link: page.url,
                        imgUrl: page.imgUrl || "",
                    });
                });
                wx.error((res) => {
                    console.error(page.url, '. wx error: ', res)
                })
            })
        }
    }
}

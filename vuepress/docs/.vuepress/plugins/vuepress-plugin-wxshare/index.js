import sharedUtils from "@vuepress/shared-utils";

/**
 * @param options `{serverUrl:'后端jssdk请求url',defaultImg:'分享头图。默认取值为this.$themeConfig.blogger.avatar，可自定义',host:'域名',desc:'描述。默认取值为this.$frontmatter.desc || this.$site.title'}`
 * @param ctx
 */
module.exports = (options, ctx) => ({
    name: "vuepress-plugin-wxshare",
    enhanceAppFiles: sharedUtils.path.resolve(__dirname, "enhanceAppFile.js"),
    clientRootMixin: sharedUtils.path.resolve(__dirname, 'clientRootMixin.js'),
    define() {
        const OPTIONS = options
        return {OPTIONS}
    },
});


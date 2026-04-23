import sharedUtils from "@vuepress/shared-utils";


module.exports = (options) => ({
    name: "vuepress-plugin-jsonld",
    enhanceAppFiles() {
        return [sharedUtils.path.resolve(__dirname, "enhanceAppFile.js")];
    },
    globalUIComponents: ["JSONLD"],
});


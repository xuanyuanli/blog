<template></template>

<script>
export default {
  created() {
    if (typeof this.$ssrContext !== "undefined") {
      this.$ssrContext.userHeadTags +=
          `<script type='application/ld+json'>
            {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": "${this.$page.title || this.$title}",
                "url": "${"https://www.xuanyuanli.cn" + this.$page.path}",
                "image": [
                    "https://cdn.staticaly.com/gh/xuanyuanli/Img@master/picx/image.5k3g1yhljok0.jpg"
                ],
                "datePublished": "${
                    (this.$page.frontmatter.date && new Date(this.$page.frontmatter.date).toISOString()) ||
                    (this.$page.lastUpdated && new Date(this.$page.lastUpdated).toISOString()) ||
                    new Date().toISOString()
                }",
                "dateModified": "${(this.$page.lastUpdated && new Date(this.$page.lastUpdated).toISOString()) || new Date().toISOString()}",
                "author": [{
                    "@type": "Person",
                    "name": "轩辕李",
                    "url": "https://www.xuanyuanli.cn"
                }]
            }
          <\/script>`;
    }
  },
};
</script>

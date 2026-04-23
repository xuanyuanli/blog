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
                "url": "${this.$frontmatter.host + this.$page.path}",
                "image": [
                    "${this.$themeConfig.blogger.avatar}"
                ],
                "datePublished": "${
                    (this.$page.frontmatter.date && new Date(this.$page.frontmatter.date).toISOString()) ||
                    (this.$page.lastUpdated && new Date(this.$page.lastUpdated).toISOString()) ||
                    new Date().toISOString()
                }",
                "dateModified": "${(this.$page.lastUpdated && new Date(this.$page.lastUpdated).toISOString()) || new Date().toISOString()}",
                "author": [{
                    "@type": "Person",
                    "name": "${this.$site.title}",
                    "url": "${this.$frontmatter.host}"
                }]
            }
          <\/script>`;
    }
  },
};
</script>

<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:bookstore="http://www.example.com/bookstore"
        xmlns:author="http://www.example.com/author"
        xmlns:publisher="http://www.example.com/publisher"
        exclude-result-prefixes="bookstore author publisher">

    <xsl:output method="html"/>

    <xsl:template match="/">
        <html>
            <body>
                <h2>Books</h2>
                <table border="1">
                    <tr bgcolor="#9acd32">
                        <th>Title</th>
                        <th>Author</th>
                        <th>Price</th>
                    </tr>
                    <xsl:apply-templates select="//bookstore:book"/>
                </table>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="bookstore:book">
        <tr>
            <td><xsl:value-of select="bookstore:title"/></td>
            <td><xsl:value-of select="author:author/author:name"/></td>
            <td><xsl:value-of select="bookstore:price"/></td>
        </tr>
    </xsl:template>
</xsl:stylesheet>

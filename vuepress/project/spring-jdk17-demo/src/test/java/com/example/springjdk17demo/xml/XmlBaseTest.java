package com.example.springjdk17demo.xml;


import java.io.StringReader;
import java.io.StringWriter;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.Attributes;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class XmlBaseTest {

    @Test
    public void createXMLDocument() {
        try {
            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 创建文档对象
            Document document = builder.newDocument();

            // 创建根元素
            String rootElementName = "books";
            org.w3c.dom.Element rootElement = document.createElement(rootElementName);
            document.appendChild(rootElement);

            // 创建子元素
            String bookElementName = "book";
            org.w3c.dom.Element bookElement = document.createElement(bookElementName);
            rootElement.appendChild(bookElement);

            // 添加子元素的属性
            bookElement.setAttribute("id", "1");

            // 添加子元素的文本内容
            String title = "Java Programming";
            org.w3c.dom.Element titleElement = document.createElement("title");
            titleElement.appendChild(document.createTextNode(title));
            bookElement.appendChild(titleElement);

            // 将文档转换为字符串
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));
            String xmlString = writer.toString();

            // 断言输出的XML字符串是否符合预期
            String expectedXmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";
            Assertions.assertEquals(xmlString, expectedXmlString);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void readXMLDocument() {
        try {
            // XML文档字符串
            String xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 从XML字符串创建文档对象
            Document document = builder.parse(new InputSource(new StringReader(xmlString)));

            // 读取XML节点的值
            String title = document.getElementsByTagName("title").item(0).getTextContent();

            // 断言读取的节点值是否符合预期
            assert title.equals("Java Programming");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testSAXParsing() {
        try {
            // 创建 SAXParserFactory 对象
            SAXParserFactory factory = SAXParserFactory.newInstance();

            // 创建 SAXParser 对象
            SAXParser saxParser = factory.newSAXParser();

            // 解析 XML 文档
            String xmlString = "<root><element1>Value 1</element1><element2>Value 2</element2></root>";
            saxParser.parse(new InputSource(new StringReader(xmlString)), new DefaultHandler() {
                @Override
                public void startElement(String uri, String localName, String qName, Attributes attributes)
                        throws SAXException {
                    System.out.println("Start Element :" + qName + " " + localName + " " + uri);
                }

                @Override
                public void endElement(String uri, String localName, String qName) throws SAXException {
                    System.out.println("End Element :" + qName + " " + localName + " " + uri);
                }

                @Override
                public void characters(char[] ch, int start, int length) throws SAXException {
                    String content = new String(ch, start, length).trim();
                    if (!content.isEmpty()) {
                        System.out.println("Content :" + content);
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void modifyXMLDocument() {
        try {
            // XML文档字符串
            String xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 从XML字符串创建文档对象
            Document document = builder.parse(new InputSource(new StringReader(xmlString)));

            // 修改节点的值
            Element titleElement = (Element) document.getElementsByTagName("title").item(0);
            titleElement.setTextContent("Java Programming 2nd Edition");

            // 将修改后的文档转换为字符串
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));
            String modifiedXmlString = writer.toString();

            // 断言修改后的XML字符串是否符合预期
            String expectedModifiedXmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming 2nd Edition</title></book></books>";
            assert modifiedXmlString.equals(expectedModifiedXmlString);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void deleteXMLNode() {
        try {
            // XML文档字符串
            String xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 从XML字符串创建文档对象
            Document document = builder.parse(new InputSource(new StringReader(xmlString)));

            // 获取要删除的节点
            Element bookElement = (Element) document.getElementsByTagName("book").item(0);

            // 删除节点
            Node parentNode = bookElement.getParentNode();
            parentNode.removeChild(bookElement);

            // 将修改后的文档转换为字符串
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));
            String modifiedXmlString = writer.toString();

            // 断言删除节点后的XML字符串是否符合预期
            String expectedModifiedXmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books/>";
            Assertions.assertEquals(modifiedXmlString, expectedModifiedXmlString);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void mergeXMLDocuments() {
        try {
            // XML文档字符串1
            String xmlString1 = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";

            // XML文档字符串2
            String xmlString2 = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"2\"><title>Python Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 从XML字符串创建文档对象1
            Document document1 = builder.parse(new InputSource(new StringReader(xmlString1)));

            // 从XML字符串创建文档对象2
            Document document2 = builder.parse(new InputSource(new StringReader(xmlString2)));

            // 获取根节点
            Element rootElement1 = document1.getDocumentElement();
            Element rootElement2 = document2.getDocumentElement();

            // 将文档2中的所有子节点添加到文档1的根节点下
            NodeList childNodes = rootElement2.getChildNodes();
            for (int i = 0; i < childNodes.getLength(); i++) {
                Node node = childNodes.item(i);
                Node importedNode = document1.importNode(node, true);
                rootElement1.appendChild(importedNode);
            }

            // 将合并后的文档转换为字符串
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document1), new StreamResult(writer));
            String mergedXmlString = writer.toString();

            // 断言合并后的XML字符串是否符合预期
            String expectedMergedXmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book><book id=\"2\"><title>Python Programming</title></book></books>";
            Assertions.assertEquals(mergedXmlString, expectedMergedXmlString);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @Test
    public void queryXMLData() {
        try {
            // XML文档字符串
            String xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book><book id=\"2\"><title>Python Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 从XML字符串创建文档对象
            Document document = builder.parse(new InputSource(new StringReader(xmlString)));

            // 查询XML数据
            NodeList bookList = document.getElementsByTagName("book");
            for (int i = 0; i < bookList.getLength(); i++) {
                Node bookNode = bookList.item(i);
                if (bookNode.getNodeType() == Node.ELEMENT_NODE) {
                    Element bookElement = (Element) bookNode;
                    String bookId = bookElement.getAttribute("id");
                    String title = bookElement.getElementsByTagName("title").item(0).getTextContent();
                    Assertions.assertEquals(bookId, i == 0 ? "1" : "2");
                    Assertions.assertEquals(title, i == 0 ? "Java Programming" : "Python Programming");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Test
    public void validateXMLDocument() {
        try {
            // XML文档字符串
            String xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?><books><book id=\"1\"><title>Java Programming</title></book></books>";

            // 创建文档工厂
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setValidating(true);

            // 创建文档解析器
            DocumentBuilder builder = factory.newDocumentBuilder();

            // 设置错误处理程序
            builder.setErrorHandler(new org.xml.sax.helpers.DefaultHandler());

            // 解析XML文档
            builder.parse(new InputSource(new StringReader(xmlString)));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}


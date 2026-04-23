package com.example.springjdk17demo.xml;

import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class SAXExample {
    public static void main(String[] args) {
        try {
            SAXParserFactory factory = SAXParserFactory.newInstance();
            SAXParser parser = factory.newSAXParser();

            DefaultHandler handler = new DefaultHandler() {
                boolean isElement = false;

                @Override
                public void startElement(String uri, String localName, String qName, Attributes attributes) {
                    isElement = true;
                }

                @Override
                public void characters(char[] ch, int start, int length) {
                    if (isElement) {
                        System.out.println(new String(ch, start, length).trim());
                        isElement = false;
                    }
                }
            };

            parser.parse("data.xml", handler);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}


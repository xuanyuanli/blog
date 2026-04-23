package com.example.springjdk17demo.xml;

import java.io.File;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

public class XstlExample {

    public static void main(String[] args) {
        try {
            File xmlFile = new File("data.xml");
            File xsltFile = new File("transform.xsl");
            File outFile = new File("output.html");

            StreamSource xmlSource = new StreamSource(xmlFile);
            StreamSource xsltSource = new StreamSource(xsltFile);
            StreamResult outputResult = new StreamResult(outFile);

            TransformerFactory factory = TransformerFactory.newInstance();
            Transformer transformer = factory.newTransformer(xsltSource);

            transformer.transform(xmlSource, outputResult);

            System.out.println("Transformation completed.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}


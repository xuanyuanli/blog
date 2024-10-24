package com.example.springjdk17demo;

import java.io.File;
import java.io.IOException;

import lombok.SneakyThrows;
import org.apache.pdfbox.pdmodel.PDDocument;

public class PdfExe {

    @SneakyThrows
    public static void main(String[] args) {
        // 使用pdfbox库完成批量解密pdf
        String folderPath = "C:\\Users\\li150\\Downloads\\2024\\24年1月-9月";
        String destDir = "C:\\Users\\li150\\Desktop\\岱岱\\";
        String password = "3690";
        String password2 = "36903690";

        File folder = new File(folderPath);
        File[] files = folder.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile() && file.getName().toLowerCase().endsWith(".pdf")) {
                    pdf(file, password, destDir, password2);
                }else if (file.isDirectory()) {
                    File[] files1 = file.listFiles();
                    if (files1!= null) {
                        for (File file1 : files1) {
                            if (file1.isFile() && file1.getName().toLowerCase().endsWith(".pdf")) {
                                pdf(file1, password, destDir, password2);
                            }
                        }
                    }
                }
            }
        }


    }

    private static void pdf(File file, String password, String destDir, String password2) {

            if (!decryptPdf(file, password, destDir)) {
                if (decryptPdf(file, password2, destDir)) {
                    System.out.println("解密成功：" + file.getName());
                } else {
                    System.out.println("解密失败：" + file.getName());
                }
            } else {
                System.out.println("解密成功：" + file.getName());
            }

    }

    private static boolean decryptPdf(File file, String password, String destDir) {
        try (PDDocument document = PDDocument.load(file, password)) {
            document.setAllSecurityToBeRemoved(true);
            document.save(destDir + file.getName());
        } catch (Exception e) {
            return false;
        }
        return true;
    }
}

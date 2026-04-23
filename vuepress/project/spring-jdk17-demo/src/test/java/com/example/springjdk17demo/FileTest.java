package com.example.springjdk17demo;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * @author John Li
 */
public class FileTest {

    @Test
    void fileDemo() throws IOException {
        File file = new File("d:/1.txt");
        file.renameTo(new File("d:/data/2.txt"));
    }

    @Test
    void pathDemo() throws IOException {
        Files.move(Paths.get("d:/1.txt"),Paths.get("d:/2.txt"));

        Path tempFile = Files.createTempFile("temp-", ".txt");
        System.out.println(tempFile);
        Files.deleteIfExists(tempFile);
    }
}

package com.example.springjdk17demo;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import org.junit.jupiter.api.Test;

/**
 * https://github.com/itwanger/toBeBetterJavaer/blob/master/docs/socket/socket.md
 * https://github.com/itwanger/toBeBetterJavaer/blob/master/docs/socket/http.md
 * https://www.pdai.tech/md/java/io/java-io-model.html
 * https://time.geekbang.org/column/article/8369
 */
public class SocketTest {


    @Test
    void server(){
        try (ServerSocket server = new ServerSocket(8888);) {
            while (true){
                Socket socket = server.accept();
                InputStream is = socket.getInputStream();
                OutputStream os = socket.getOutputStream();
                Scanner scanner = new Scanner(is);
                PrintWriter pw = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);

                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine();
                    if (line.startsWith("我要吃肉")){
                        pw.println("地主家没有余粮了");
                    }else {
                        pw.println("我不知道你在说什么");
                    }
                    if ("exit".equals(line)) {
                        pw.println("exit");
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    void client(){
        try (Socket socket = new Socket("localhost", 8888);
                InputStream is = socket.getInputStream();
                OutputStream outputStream = socket.getOutputStream();) {
            PrintWriter pw = new PrintWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), true);
            Scanner scanner = new Scanner(is, StandardCharsets.UTF_8);
            pw.println("我要吃肉");
            pw.println("exit");
            boolean done = false;
            while (!done && scanner.hasNextLine()) {
                String line = scanner.nextLine();
                System.out.println(line);
                if (line.equals("exit")){
                    done = true;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}

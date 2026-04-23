package com.example.springjdk17demo;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.channels.AsynchronousServerSocketChannel;
import java.nio.channels.AsynchronousSocketChannel;
import java.nio.channels.CompletionHandler;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

@Slf4j
public class AioSocketTest {
   static final InetSocketAddress address = new InetSocketAddress("127.0.0.1", 8888);
    private static final Object waitObject = new Object();

    @Test
    void server() throws IOException, InterruptedException {
        AsynchronousServerSocketChannel serverSock =        AsynchronousServerSocketChannel.open().bind(address);
        serverSock.accept(serverSock, new CompletionHandler<>() { //为异步操作指定CompletionHandler回调函数
            @SneakyThrows
            @Override
            public void completed(AsynchronousSocketChannel socketChannel, AsynchronousServerSocketChannel serverSock) {
                serverSock.accept(serverSock, this);
                ByteBuffer byteBuffer = ByteBuffer.allocate(50);
                socketChannel.read(byteBuffer, new StringBuffer(), new IntegerStringBufferCompletionHandler(socketChannel, byteBuffer));
            }

            @Override
            public void failed(Throwable exc, AsynchronousServerSocketChannel attachment) {

            }
        });

        //等待，以便观察现象(这个和要讲解的原理本身没有任何关系，只是为了保证守护线程不会退出)
        synchronized(waitObject) {
            waitObject.wait();
        }
    }

    @Test
    void client() throws IOException{
        AsynchronousSocketChannel asynchronousSocketChannel = AsynchronousSocketChannel.open();
        //连接服务端，异步方式
        asynchronousSocketChannel.connect(address, asynchronousSocketChannel,
                new CompletionHandler<>() {
                    @SneakyThrows
                    @Override
                    public void completed(Void result, AsynchronousSocketChannel attachment) {
                        System.out.println("连接成功");
                        attachment.write(ByteBuffer.wrap("我要吃肉".getBytes())).get();
                        ByteBuffer buffer =ByteBuffer.allocate(1024);
                        while (attachment.read(buffer).get() != -1) {
                            buffer.flip();
                            CharBuffer decode = Charset.defaultCharset().decode(buffer);
                            System.out.println(decode);
                            buffer.clear();
                            if (decode.toString().equals("exit")){
                                break;
                            }
                            attachment.write(ByteBuffer.wrap("exit".getBytes())).get();
                        }
                    }

                    @Override
                    public void failed(Throwable exc, AsynchronousSocketChannel attachment) {

                    }
                });
    }

    private static class IntegerStringBufferCompletionHandler implements CompletionHandler<Integer, StringBuffer> {

        private final AsynchronousSocketChannel socketChannel;
        private final ByteBuffer byteBuffer;

        public IntegerStringBufferCompletionHandler(AsynchronousSocketChannel socketChannel, ByteBuffer byteBuffer) {
            this.socketChannel = socketChannel;
            this.byteBuffer = byteBuffer;
        }

        @SneakyThrows
        @Override
        public void completed(Integer result, StringBuffer attachment) {
            if(result == -1) {
                try {
                    socketChannel.close();
                } catch (IOException e) {
                    log.error("socketChannel.close()",e);
                }
                return;
            }

            byteBuffer.flip();
            CharBuffer charBuffer = StandardCharsets.UTF_8.decode(byteBuffer);
            byteBuffer.clear();
            String line = charBuffer.toString();
            System.out.println("接受到内容："+line);
            if ("exit".equals(line)) {
                socketChannel.write(StandardCharsets.UTF_8.encode("exit")).get();
            }
            if (line.startsWith("我要吃肉")){
                socketChannel.write(StandardCharsets.UTF_8.encode("地主家没有余粮了")).get();
            }else {
                socketChannel.write(StandardCharsets.UTF_8.encode("我不知道你在说什么")).get();
            }
            socketChannel.read(byteBuffer,attachment,this);
        }

        @Override
        public void failed(Throwable exc, StringBuffer attachment) {

        }
    }
}

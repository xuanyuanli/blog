package com.example.springjdk17demo;

import java.io.IOException;
import java.io.InputStream;
import java.net.CookieHandler;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpClient.Version;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import kong.unirest.HttpResponse;
import kong.unirest.JsonNode;
import kong.unirest.Unirest;
import kong.unirest.UnirestInstance;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Test;

public class HttpTest {

    @Test
    void old(){
        try {
            String turl = "https://www.baidu.com/";
            URL url = new URL(turl);
            //得到connection对象。
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            //设置请求方式
            connection.setRequestMethod("GET");
            //连接
            connection.connect();
            //得到响应码
            int responseCode = connection.getResponseCode();
            if(responseCode == HttpURLConnection.HTTP_OK){
                //得到响应流
                InputStream inputStream = connection.getInputStream();
                //将响应流转换成字符串
                System.out.println(IOUtils.toString(inputStream, StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    void unirest(){
        UnirestInstance newUnirest = Unirest.spawnInstance();
        newUnirest.config().defaultBaseUrl("http://homestar.com").connectTimeout(10000)
                .socketTimeout(30000).proxy("127.0.0.1",8888)
                .concurrency(200,10);
        HttpResponse<JsonNode> response = Unirest.post("http://localhost/post")
                .connectTimeout(10000)
                .socketTimeout(30000).proxy("127.0.0.1",8888)
                .header("accept", "application/json")
                .queryString("apiKey", "123")
                .field("parameter", "value")
                .field("firstname", "Gary")
                .asJson();
    }

    @Test
    void java11() throws IOException, InterruptedException {
        HttpClient client = HttpClient.newBuilder()
                .proxy(ProxySelector.of(new InetSocketAddress("127.0.0.1",8888)))
                .connectTimeout(Duration.ofMillis(1))
                .version(Version.HTTP_2)
                .cookieHandler(new CookieHandler() {
                    @Override
                    public Map<String, List<String>> get(URI uri, Map<String, List<String>> requestHeaders) {
                        return requestHeaders;
                    }

                    @Override
                    public void put(URI uri, Map<String, List<String>> responseHeaders) {
                    }
                })
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://www.baidu.com/")).timeout(Duration.ofMillis(2))
                .build();
        String body = client.send(request, BodyHandlers.ofString()).body();
        System.out.println(body);
    }
}

package com.example.springjdk17demo.spider;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.junit.jupiter.api.Test;

/**
 * @author John Li
 * @date 2023/6/15
 */
@SuppressWarnings("NewClassNamingConvention")
public class AiImageSpider {

    @Test
    void mazeGuruLandscape() throws IOException, InterruptedException {
        mazeGuruDownload("Landscape", false);
    }

    @Test
    void mazeGuruPortrait() throws IOException, InterruptedException {
        mazeGuruDownload("Portrait", false);
    }

    @Test
    void mazeGuruAnimal() throws IOException, InterruptedException {
        mazeGuruDownload("Animal", false);
    }

    @Test
    void mazeGuruAnime() throws IOException, InterruptedException {
        mazeGuruDownload("Anime", true);
    }

    @Test
    void mazeGuruArchitecture() throws IOException, InterruptedException {
        mazeGuruDownload("Architecture", false);
    }

    @Test
    void mazeGuruEpic() throws IOException, InterruptedException {
        mazeGuruDownload("Epic", false);
    }

    @Test
    void mazeGuruIllustration() throws IOException, InterruptedException {
        mazeGuruDownload("Illustration", true);
    }

    @Test
    void mazeGuruGreens() throws IOException, InterruptedException {
        mazeGuruDownload("Greens", false);
    }


    @Test
    void mazeGuruPhotograph() throws IOException, InterruptedException {
        mazeGuruDownload("Photograph", true);
    }

    @Test
    void mazeGuru3D() throws IOException, InterruptedException {
        mazeGuruDownload("3D", true);
    }

    private static void mazeGuruDownload(String topic, boolean isArtworkType) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://maze.guru/maze-ai/search?start=0&limit=1000"))
                .header("authority", "maze.guru")
                .header("User-Agent", "Chrome/108.0.0.0 Safari/537.36")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"order_by\":\"recommend_time\",\"order_mode\":\"desc\",\"" + (isArtworkType ? "artwork_type" : "content") + "\":\"" + topic + "\"}"))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JSON.parseObject(response.body()).getJSONArray("data").parallelStream().forEach(item -> {
            if (item instanceof JSONObject cur) {
                String url = cur.getString("url");
                download("maze-guru/", url);
            }
        });
    }

    /**
     * 下载
     *
     * @param childDir 图片子目录
     * @param imageUrl 图像url
     */
    public static void download(String childDir, String imageUrl) {
        String targetDirectory = "D:/ai-drawing/" + childDir;
        try {
            Files.createDirectories(Path.of(targetDirectory));
            URL url = new URL(imageUrl);
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Path targetPath = Path.of(targetDirectory + fileName);
            if (Files.exists(targetPath)) {
                return;
            }
            try (InputStream in = url.openStream()) {
                Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            System.out.println("Downloaded " + fileName);
        } catch (IOException e) {
            System.err.println("Failed to download the image: " + e.getMessage());
        }
    }
}

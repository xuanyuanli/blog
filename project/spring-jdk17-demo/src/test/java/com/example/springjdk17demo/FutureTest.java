package com.example.springjdk17demo;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import org.junit.jupiter.api.Test;

public class FutureTest {

    @Test
    void future() throws ExecutionException, InterruptedException {
        FutureTask<Double> futureTask = new FutureTask<>(() -> {
            Thread.sleep(3000);
            return Math.pow(10, 2);
        });
        Thread thread = new Thread(futureTask);
        thread.start();
        System.out.println(futureTask.get());
    }

    @Test
    void cfuture() throws InterruptedException, ExecutionException {
        CompletableFuture<String> rice = CompletableFuture.supplyAsync(()->{
            System.out.println("开始制作米饭，并获得煮熟的米饭");
            return "煮熟的米饭";
        });
        //煮米饭的同时呢，我又做了牛奶
        CompletableFuture mike = CompletableFuture.supplyAsync(()->{
            System.out.println("开始热牛奶，并获得加热的牛奶");
            return "加热的牛奶";
        });
        // 我想两个都好了，才吃早饭，thenCombineAsync有入参，有返回值
        mike.thenCombineAsync(rice,(m,r)->{
            System.out.println("我收获了早饭："+m+","+r);
            return String.valueOf(m) + r;
        });
        // 有入参，无返回值
        mike.thenAcceptBothAsync(rice,(m,r)->{
            System.out.println("我收获了早饭："+m+","+r);
        });
        // 无入参，无返回值
        mike.runAfterBothAsync(rice,()->{
            System.out.println("我收获了早饭");
        });

        // 或者直接连接两个CompletableFuture
        rice.thenComposeAsync(r->CompletableFuture.supplyAsync(()->{
            System.out.println("开始煮牛奶");
            System.out.println("同时开始煮米饭");
            return "mike";
        }));
    }

    Double fetchPrice() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
        }
        return 5 + Math.random() * 20;
    }
}

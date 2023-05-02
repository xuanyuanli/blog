package com.example.springjdk17demo.concurrent;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class PrimeFinder {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        List<Future<List<Integer>>> futures = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            int start = i * 10 + 1;
            int end = (i + 1) * 10;
            futures.add(executor.submit(new PrimeRangeFinder(start, end)));
        }

        for (Future<List<Integer>> future : futures) {
            System.out.println("Primes: " + future.get());
        }

        executor.shutdown();
    }
}

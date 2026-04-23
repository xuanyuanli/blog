package com.example.springjdk17demo.concurrent;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class MyTaskTest {

    @Test
    void compute() {
        Integer invoke = new MyTask(1, 100).invoke();
        System.out.println(invoke.toString());
    }

    @Test
    void custom() throws ExecutionException, InterruptedException {
        List<Integer> integerList = IntStream.range(1, 1000).boxed().collect(Collectors.toList());

        ForkJoinPool customThreadPool = new ForkJoinPool(4);
        Integer actualTotal = customThreadPool.submit(
                () -> integerList.parallelStream().reduce(0, Integer::sum)).get();
        System.out.println(actualTotal);
    }
}

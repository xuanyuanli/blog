package com.example.springjdk17demo;

import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAccumulator;

public class ThreadTest {

    public static void main(String[] args) throws InterruptedException {
        accumulator();
    }

    static void incr() throws InterruptedException {
        AtomicInteger incr = new AtomicInteger();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                incr.incrementAndGet();
            }
        }).start();
        new Thread(()->{
            for(int i = 0; i < 9; i++) {
                incr.decrementAndGet();
            }
        }).start();
        Thread.sleep(1000);
        System.out.println(incr.get());
    }

    static void accumulator() throws InterruptedException {
        LongAccumulator accumulator = new LongAccumulator(Long::max, Long.MAX_VALUE);
        new Thread(()->{
            for(int i = 0; i < 100; i++) {
                accumulator.accumulate(new Random().nextLong());
            }
        }).start();
        Thread.sleep(1000);
        System.out.println(accumulator.get());
    }
}

package com.example.springjdk17demo.concurrent;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;

public class PrimeRangeFinder implements Callable<List<Integer>> {
    private final int start;
    private final int end;

    public PrimeRangeFinder(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Override
    public List<Integer> call() {
        List<Integer> primes = new ArrayList<>();
        for (int i = start; i <= end; i++) {
            if (isPrime(i)) {
                primes.add(i);
            }
        }
        return primes;
    }

    private boolean isPrime(int number) {
        if (number <= 1) {
            return false;
        }
        for (int i = 2; i <= Math.sqrt(number); i++) {
            if (number % i == 0) {
                return false;
            }
        }
        return true;
    }
}

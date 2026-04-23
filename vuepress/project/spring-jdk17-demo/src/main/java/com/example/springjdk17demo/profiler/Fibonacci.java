package com.example.springjdk17demo.profiler;

public class Fibonacci {
    public static long fib(int n) {
        if (n <= 1) {
            return n;
        }
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        for (int i = 1; i <= 40; i++) {
            System.out.println("Fibonacci of " + i + " is: " + fib(i));
        }
    }
}

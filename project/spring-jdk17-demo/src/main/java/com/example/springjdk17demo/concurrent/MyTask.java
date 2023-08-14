package com.example.springjdk17demo.concurrent;

import java.util.concurrent.RecursiveTask;

/**
 * @author xuanyuanli
 * @date 2023/8/9
 */
public class MyTask extends RecursiveTask<Integer> {
    private static final int THRESHOLD = 10;
    private int start;
    private int end;

    public MyTask(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Override
    protected Integer compute() {
        if (end - start <= THRESHOLD) {
            // 当任务足够小，直接计算结果
            int sum = 0;
            for (int i = start; i <= end; i++) {
                sum += i;
            }
            return sum;
        } else {
            // 任务太大，需要拆分为子任务
            int mid = (start + end) / 2;
            MyTask leftTask = new MyTask(start, mid);
            MyTask rightTask = new MyTask(mid + 1, end);

            // 拆分任务并等待子任务的完成
            leftTask.fork();
            rightTask.fork();

            // 合并子任务的结果
            int leftResult = leftTask.join();
            int rightResult = rightTask.join();

            return leftResult + rightResult;
        }
    }
}

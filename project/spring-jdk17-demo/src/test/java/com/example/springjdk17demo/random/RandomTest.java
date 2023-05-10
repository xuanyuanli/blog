package com.example.springjdk17demo.random;

import java.util.Random;
import java.util.random.RandomGenerator;
import java.util.random.RandomGenerator.JumpableGenerator;
import java.util.random.RandomGenerator.LeapableGenerator;
import java.util.random.RandomGenerator.SplittableGenerator;
import java.util.random.RandomGenerator.StreamableGenerator;
import java.util.random.RandomGeneratorFactory;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

public class RandomTest {

    @Test
    void isStatistical() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isStatistical).forEach(e -> System.out.println(e.name()));
    }

    @Test
    void isHardware() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isHardware).forEach(e -> System.out.println(e.name()));
    }

    @Test
    void isStochastic() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isStochastic).forEach(e -> System.out.println(e.name()));
    }

    @Test
    void isJumpable() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isJumpable).forEach(e -> System.out.println(e.name()));

        // 创建一个 JumpableGenerator
        JumpableGenerator gen = (JumpableGenerator) RandomGeneratorFactory.of("Xoroshiro128PlusPlus").create();

        // 为每个子任务创建一个跳跃后的生成器
        JumpableGenerator gen1 = (JumpableGenerator) gen.copyAndJump();

        // 现在 gen、gen1 都可以独立地生成随机数，而不会有重叠
        int random1 = gen.nextInt();
        int random2 = gen1.nextInt();
    }

    @Test
    void isLeapable() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isLeapable).forEach(e -> System.out.println(e.name()));

        // 创建一个 LeapableGenerator
        LeapableGenerator gen = (LeapableGenerator) RandomGeneratorFactory.of("Xoroshiro128PlusPlus").create();

        // 为每个子任务创建一个跳跃后的生成器
        LeapableGenerator gen1 = (LeapableGenerator) gen.copyAndLeap();

        // 现在 gen、gen1 都可以独立地生成随机数，而不会有重叠
        int random1 = gen.nextInt();
        int random2 = gen1.nextInt();
    }

    @Test
    void isStreamable() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isStreamable).forEach(e -> System.out.println(e.name()));

        RandomGeneratorFactory<RandomGenerator> factory = RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isStreamable)
                .min((f, g) -> Integer.compare(g.stateBits(), f.stateBits())).orElseThrow();
        StreamableGenerator rng = (StreamableGenerator) factory.create(1000);
        rng.longs(20).parallel().forEach(System.out::println);
    }

    @Test
    void isSplittable() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isSplittable).forEach(e -> System.out.println(e.name()));

        SplittableGenerator gen = (SplittableGenerator) RandomGeneratorFactory.of("L128X128MixRandom").create();
        Stream<SplittableGenerator> splits = gen.splits(20);
        splits.parallel()
                .forEach(r -> System.out.println(r.nextLong()));
    }

    @Test
    void isSplittable2() {
        RandomGeneratorFactory.all().filter(RandomGeneratorFactory::isSplittable).forEach(e -> System.out.println(e.name()));

        // 创建一个 SplittableGenerator
        SplittableGenerator gen = (SplittableGenerator) RandomGeneratorFactory.of("L32X64MixRandom").create();

        // 为每个子任务创建一个分割的生成器
        SplittableGenerator gen1 = gen.split();
        SplittableGenerator gen2 = gen.split();

        // 现在 gen、gen1 和 gen2 都可以独立地生成随机数，而不会有重叠
        int random1 = gen.nextInt();
        int random2 = gen1.nextInt();
        int random3 = gen2.nextInt();
    }

    @Test
    void rand() {
        Random random = new Random(123);

        // 输出前五个随机整数
        for (int i = 0; i < 5; i++) {
            System.out.println(random.nextInt());
        }
    }
}

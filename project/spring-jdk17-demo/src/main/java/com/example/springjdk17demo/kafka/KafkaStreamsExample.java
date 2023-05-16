package com.example.springjdk17demo.kafka;

import java.util.Properties;
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.kstream.*;

/**
 * @author John Li
 * @date 2023/5/16
 */
public class KafkaStreamsExample {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-streams-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

        StreamsBuilder builder = new StreamsBuilder();
        KStream<String, String> input = builder.stream("input-topic");
        KStream<String, String> transformed = input.mapValues(value -> value.toUpperCase());
        transformed.to("output-topic");

        try (KafkaStreams streams = new KafkaStreams(builder.build(), props)) {
            streams.start();
        }
    }
}

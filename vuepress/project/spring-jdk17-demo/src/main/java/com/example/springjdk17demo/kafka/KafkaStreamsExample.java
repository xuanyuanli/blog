package com.example.springjdk17demo.kafka;

import java.util.Arrays;
import java.util.Properties;
import org.apache.kafka.common.serialization.Serdes;
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

        KTable<String, Long> wordCountTable = input
                .flatMapValues(textLine -> Arrays.asList(textLine.toLowerCase().split("\\W+")))
                .groupBy((key, word) -> word)
                .count(Named.as("WordCountStore"));

        wordCountTable.toStream().to("output-topic",Produced.with(Serdes.String(), Serdes.Long()));

        try (KafkaStreams streams = new KafkaStreams(builder.build(), props)) {
            streams.start();
        }
    }

}

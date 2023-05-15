package com.example.springjdk17demo.kafka;

import java.util.Properties;
import java.util.concurrent.Future;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;

/**
 * 卡夫卡生产商例子
 *
 * @author John Li
 * @date 2023/05/15
 */
public class KafkaProducerExample {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

        Producer<String, String> producer = new KafkaProducer<>(props);
        String topic = "my-topic";
        String key = "my-key";
        String value = "Hello, Kafka!";

        ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, value);

        try {
            RecordMetadata metadata = producer.send(record).get();
            System.out.println("Message sent successfully. Offset: " + metadata.offset());
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error sending message: " + e.getMessage());
        }

        producer.send(record, new Callback() {
            public void onCompletion(RecordMetadata metadata, Exception exception) {
                if (exception == null) {
                    System.out.println("Message sent successfully. Offset: " + metadata.offset());
                } else {
                    System.err.println("Error sending message: " + exception.getMessage());
                }
            }
        });

        producer.close();
    }

    private static void batch() {
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        // 设置批量大小
        props.put("batch.size", 16384);
        // 设置等待时间
        props.put("linger.ms", 10);

        Producer<String, String> producer = new KafkaProducer<>(props);
        String topic = "my-topic";

        for (int i = 0; i < 1000; i++) {
            String key = "key-" + i;
            String value = "Message-" + i;
            ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, value);

            producer.send(record);
        }

        producer.close();
    }
}


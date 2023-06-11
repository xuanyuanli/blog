package com.example.springjdk17demo.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import org.junit.jupiter.api.Test;

class JacksonsTest {

    static ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void readStr() throws JsonProcessingException {
        String jsonString = "{\"name\":\"John\",\"age\":30}";

        // JSON字符串转Java对象
        MyClass myObject = objectMapper.readValue(jsonString, MyClass.class);
        System.out.println(myObject);
    }

    @Test
    void readFile() throws IOException {
        File jsonFile = new File("data.json");

        // JSON文件转Java对象
        MyClass myObject = objectMapper.readValue(jsonFile, MyClass.class);
        System.out.println(myObject);
    }

    @Test
    void jsonNode() throws JsonProcessingException {
        String jsonString = "{\"name\":\"John\",\"age\":30,\"address\":{\"street\":\"123 Main St\",\"city\":\"New York\"},\"pets\":[{\"name\":\"Fluffy\",\"species\":\"cat\"},{\"name\":\"Buddy\",\"species\":\"dog\"}]}";
        // 将JSON字符串转换为JsonNode对象
        JsonNode jsonNode = objectMapper.readTree(jsonString);

        // 访问JsonNode中的数据
        String name = jsonNode.get("name").asText();
        int age = jsonNode.get("age").asInt();
        String street = jsonNode.get("address").get("street").asText();
        String city = jsonNode.get("address").get("city").asText();
        JsonNode pets = jsonNode.get("pets");

        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Street: " + street);
        System.out.println("City: " + city);
        System.out.println("Pets:");

        for (JsonNode pet : pets) {
            String petName = pet.get("name").asText();
            String species = pet.get("species").asText();
            System.out.println("  Pet Name: " + petName);
            System.out.println("  Species: " + species);
        }
    }

    record MyClass(String name, Integer age) {

    }
}

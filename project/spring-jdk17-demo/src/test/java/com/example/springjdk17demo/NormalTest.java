package com.example.springjdk17demo;

import java.util.logging.Level;
import java.util.logging.Logger;
import org.junit.jupiter.api.Test;

public class NormalTest {

    @Test
    void log() {
        Logger.getGlobal().log(Level.INFO, "hello");
    }
}

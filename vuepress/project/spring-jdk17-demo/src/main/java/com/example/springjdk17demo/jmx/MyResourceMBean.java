package com.example.springjdk17demo.jmx;

import javax.management.NotificationEmitter;

public interface MyResourceMBean extends NotificationEmitter {

    int getValue();

    void setValue(int value);

    void reset();
}

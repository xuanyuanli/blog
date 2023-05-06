package com.example.springjdk17demo.jmx;

import java.util.concurrent.atomic.AtomicLong;
import javax.management.AttributeChangeNotification;
import javax.management.MBeanNotificationInfo;
import javax.management.Notification;
import javax.management.NotificationBroadcasterSupport;

public class MyResource extends NotificationBroadcasterSupport implements MyResourceMBean {

    private int value;
    private AtomicLong sequenceNumber = new AtomicLong(1);

    @Override
    public int getValue() {
        return value;
    }

    @Override
    public void setValue(int value) {
        int oldValue = this.value;
        this.value = value;
        // 发送通知
        Notification notification = new AttributeChangeNotification(
                this,
                sequenceNumber.getAndIncrement(),
                System.currentTimeMillis(),
                "Value changed",
                "Value",
                "int",
                oldValue,
                value
        );
        sendNotification(notification);
    }

    @Override
    public void reset() {
        value = 0;
    }

    @Override
    public MBeanNotificationInfo[] getNotificationInfo() {
        MBeanNotificationInfo[] info = new MBeanNotificationInfo[1];
        String[] types = new String[]{
                AttributeChangeNotification.ATTRIBUTE_CHANGE
        };
        info[0] = new MBeanNotificationInfo(types, AttributeChangeNotification.class.getName(), "Value change notification");
        return info;
    }
}

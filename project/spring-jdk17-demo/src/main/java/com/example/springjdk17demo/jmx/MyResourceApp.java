package com.example.springjdk17demo.jmx;

import java.lang.management.ManagementFactory;
import javax.management.MBeanServer;
import javax.management.ObjectName;

public class MyResourceApp {

    public static void main(String[] args) throws Exception {
        // 获取平台 MBean Server
        MBeanServer mbeanServer = ManagementFactory.getPlatformMBeanServer();

        // 创建 MyResource MBean 实例
        MyResourceMBean myResource = new MyResource();

        // 创建 ObjectName 实例
        ObjectName myResourceName = new ObjectName("com.example:type=MyResource");

        // 将 MBean 注册到 MBean Server
        mbeanServer.registerMBean(myResource, myResourceName);

        // 保持应用程序运行，以便客户端可以连接
        System.out.println("MyResource MBean registered. Press Enter to exit...");
        System.in.read();
    }
}

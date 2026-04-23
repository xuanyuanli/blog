package com.example.springjdk17demo.jasypt;

import static org.junit.jupiter.api.Assertions.*;

import org.jasypt.encryption.StringEncryptor;
import org.junit.jupiter.api.Test;

class JasyptsTest {
    @Test
    public void encryptor() {
        StringEncryptor encryptor = Jasypts.getDefaultStringEncryptor("Nrl9KHQhapJkR6ad");
        System.out.println(encryptor.encrypt("admin"));
        System.out.println(encryptor.decrypt("DPdTgdFw1pMLaSznwRINwg=="));
    }

    @Test
    public void pwd() {
        String encryptPassword = Jasypts.encryptPassword("xiao&Test");
        System.out.println(encryptPassword);
    }
}

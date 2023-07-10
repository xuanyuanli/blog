package com.example.springjdk17demo.jasypt;

import org.jasypt.digest.config.SimpleDigesterConfig;
import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.PooledPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.SimpleStringPBEConfig;
import org.jasypt.util.password.ConfigurablePasswordEncryptor;

/**
 * Jasypt工具
 *
 * @author John Li
 */
public class Jasypts {

    static final ConfigurablePasswordEncryptor PASSWORD_ENCRYPTOR;

    static {
        PASSWORD_ENCRYPTOR = new ConfigurablePasswordEncryptor();
        SimpleDigesterConfig config = new SimpleDigesterConfig();
        config.setAlgorithm("SHA-256");
        config.setIterations(2000);
        config.setSaltSizeBytes(16);
        PASSWORD_ENCRYPTOR.setConfig(config);
    }

    /**
     * 获得jasypt-spring-boot-starter默认的StringEncryptor
     */
    public static StringEncryptor getDefaultStringEncryptor(String password) {
        PooledPBEStringEncryptor encryptor = new PooledPBEStringEncryptor();
        SimpleStringPBEConfig config = new SimpleStringPBEConfig();
        config.setPassword(password);
        config.setAlgorithm("PBEWithMD5AndDES");
        config.setKeyObtentionIterations("1000");
        config.setPoolSize("1");
        config.setProviderName("SunJCE");
        config.setSaltGeneratorClassName("org.jasypt.salt.RandomSaltGenerator");
        config.setIvGeneratorClassName("org.jasypt.salt.NoOpIVGenerator");
        config.setStringOutputType("base64");
        encryptor.setConfig(config);
        return encryptor;
    }

    /**
     * 密码加密
     */
    public static String encryptPassword(String password) {
        return PASSWORD_ENCRYPTOR.encryptPassword(password);
    }

    /**
     * 校验密码
     */
    public static boolean checkPassword(String password, String encryptPassword) {
        try {
            return PASSWORD_ENCRYPTOR.checkPassword(password, encryptPassword);
        } catch (Exception e) {
            return false;
        }
    }
}


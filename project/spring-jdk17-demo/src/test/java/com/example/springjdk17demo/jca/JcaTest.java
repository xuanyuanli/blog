package com.example.springjdk17demo.jca;

import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameterGenerator;
import java.security.AlgorithmParameters;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Provider;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Security;
import java.security.Signature;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.DHParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lombok.SneakyThrows;
import org.junit.jupiter.api.Test;

public class JcaTest {

    @Test
    void message() throws NoSuchAlgorithmException {
        String message = "Hello, JCA!";
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(message.getBytes());
        System.out.println("Message Digest: " + Base64.getEncoder().encodeToString(digest));
    }

    @Test
    void digetalSign() throws Exception {
        String message = "Hello, JCA!";

        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        PublicKey publicKey = keyPair.getPublic();
        PrivateKey privateKey = keyPair.getPrivate();

        // 使用私钥对消息加密
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(message.getBytes());
        byte[] signedData = signature.sign();
        String encodedSignedData = Base64.getEncoder().encodeToString(signedData);
        System.out.println("Signed Data: " + encodedSignedData);

        // 使用公钥验证消息
        Signature verifySignature = Signature.getInstance("SHA256withRSA");
        verifySignature.initVerify(publicKey);
        verifySignature.update(message.getBytes());
        boolean isVerified = verifySignature.verify(signedData);
        System.out.println("Signature verification: " + isVerified);
    }

    @SneakyThrows
    @Test
    void symmetricEncryption(){
        String message = "Hello, JCA!";
        String keyString = "abcdefghijklmnop"; // 128-bit key
        SecretKey key = new SecretKeySpec(keyString.getBytes(StandardCharsets.UTF_8), "AES");

        // Encrypt the message
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedData = cipher.doFinal(message.getBytes());
        String encodedEncryptedData = Base64.getEncoder().encodeToString(encryptedData);
        System.out.println("Encrypted Data: " + encodedEncryptedData);

        // Decrypt the message
        Cipher decryptCipher = Cipher.getInstance("AES");
        decryptCipher.init(Cipher.DECRYPT_MODE, key);
        byte[] decryptedData = decryptCipher.doFinal(encryptedData);
        String decryptedMessage = new String(decryptedData, StandardCharsets.UTF_8);
        System.out.println("Decrypted Message: " + decryptedMessage);
    }

    @SneakyThrows
    @Test
    void asymmetricEncryption(){
        String message = "Hello, JCA!";

        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        PublicKey publicKey = keyPair.getPublic();
        PrivateKey privateKey = keyPair.getPrivate();

        // Encrypt the message
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        byte[] encryptedData = cipher.doFinal(message.getBytes());
        String encodedEncryptedData = Base64.getEncoder().encodeToString(encryptedData);
        System.out.println("Encrypted Data: " + encodedEncryptedData);

        // Decrypt the message
        Cipher decryptCipher = Cipher.getInstance("RSA");
        decryptCipher.init(Cipher.DECRYPT_MODE, privateKey);
        byte[] decryptedData = decryptCipher.doFinal(encryptedData);
        String decryptedMessage = new String(decryptedData, StandardCharsets.UTF_8);
        System.out.println("Decrypted Message: " + decryptedMessage);
    }

    @SneakyThrows
    @Test
    void keyExchange(){
        // 生成Diffie-Hellman算法的参数集
        AlgorithmParameterGenerator paramGen = AlgorithmParameterGenerator.getInstance("DH");
        paramGen.init(1024);
        AlgorithmParameters params = paramGen.generateParameters();
        DHParameterSpec dhSpec = params.getParameterSpec(DHParameterSpec.class);

        // 为Alice和Bob生成密钥对
        KeyPairGenerator aliceKpg = KeyPairGenerator.getInstance("DH");
        aliceKpg.initialize(dhSpec);
        KeyPair aliceKp = aliceKpg.generateKeyPair();

        KeyPairGenerator bobKpg = KeyPairGenerator.getInstance("DH");
        bobKpg.initialize(dhSpec);
        KeyPair bobKp = bobKpg.generateKeyPair();

        // Perform key agreement
        KeyAgreement aliceKa = KeyAgreement.getInstance("DH");
        aliceKa.init(aliceKp.getPrivate());
        aliceKa.doPhase(bobKp.getPublic(), true);
        byte[] aliceSharedSecret = aliceKa.generateSecret();

        KeyAgreement bobKa = KeyAgreement.getInstance("DH");
        bobKa.init(bobKp.getPrivate());
        bobKa.doPhase(aliceKp.getPublic(), true);
        byte[] bobSharedSecret = bobKa.generateSecret();

        // Derive AES keys from shared secrets
        SecretKeySpec aliceAesKey = new SecretKeySpec(aliceSharedSecret, 0, 16, "AES");
        SecretKeySpec bobAesKey = new SecretKeySpec(bobSharedSecret, 0, 16, "AES");

        System.out.println("Alice's shared secret: " + Base64.getEncoder().encodeToString(aliceAesKey.getEncoded()));
        System.out.println("Bob's shared secret: " + Base64.getEncoder().encodeToString(bobAesKey.getEncoded()));
    }

    @SneakyThrows
    @Test
    void encryptedCommunication(){
        // 假设这里已经得到了共享密钥，这里我们直接使用上面的代码生成的密钥
        byte[] key = {-79, -99, 120, -4, 15, 88, -40, 47, 92, -38, -69, -92, 64, -123, 3, -8, 60, 54, 54, -122, -7, -5, -89, -47, 66, -69, 68, -55, 54, 12, 88,
                0, 102, 99, -25, 25, -126, -120, 108, -114, 70, -58, -60, -76, 85, -106, -119, -6, 17, 81, -124, 64, -117, -79, 82, 28, -12, -5, 58, -121, -28,
                -55, -65, -31, -109, -89, 5, -76, -91, -18, -44, -92, 86, 75, -118, 14, 86, -117, -83, -15, -106, 39, 44, -10, -83, -7, -113, -22, -68, 50, -6,
                -91, -122, 40, -61, 17, 38, -57, -124, -61, -28, 33, -37, 106, 91, 33, 122, -91, 100, 117, 72, 75, 15, 92, 115, -103, 108, -52, 94, 56, -108,
                -121, -81, 86, -96, 33, -42, -33};
        SecretKeySpec sharedSecretKey = new SecretKeySpec(key, 0, 16, "AES");

        // 需要发送的消息
        String message = "Hello, this is a secret message!";

        // Alice使用共享密钥加密消息
        Cipher encryptCipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        byte[] iv = new byte[16];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        encryptCipher.init(Cipher.ENCRYPT_MODE, sharedSecretKey, ivSpec);
        byte[] encryptedMessage = encryptCipher.doFinal(message.getBytes(StandardCharsets.UTF_8));

        // 将加密后的消息和IV发送给Bob
        byte[] messageToSend = new byte[iv.length + encryptedMessage.length];
        System.arraycopy(iv, 0, messageToSend, 0, iv.length);
        System.arraycopy(encryptedMessage, 0, messageToSend, iv.length, encryptedMessage.length);

        // Bob接收到消息后，使用共享密钥解密
        byte[] receivedIv = Arrays.copyOfRange(messageToSend, 0, 16);
        byte[] receivedEncryptedMessage = Arrays.copyOfRange(messageToSend, 16, messageToSend.length);
        IvParameterSpec receivedIvSpec = new IvParameterSpec(receivedIv);

        Cipher decryptCipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        decryptCipher.init(Cipher.DECRYPT_MODE, sharedSecretKey, receivedIvSpec);
        byte[] decryptedMessage = decryptCipher.doFinal(receivedEncryptedMessage);
        String receivedMessage = new String(decryptedMessage, StandardCharsets.UTF_8);

        // 输出解密后的消息
        System.out.println("Received message: " + receivedMessage);
    }

    @Test
    void secureRandom(){
        SecureRandom random = new SecureRandom();
        byte[] randomBytes = new byte[16];
        random.nextBytes(randomBytes);
        System.out.println("Random Bytes: " + Base64.getEncoder().encodeToString(randomBytes));
    }

    @Test
    void secureRandomProvider(){
        Provider[] providers = Security.getProviders();
        for (Provider provider : providers) {
            System.out.println(provider.getName());
        }
    }
}

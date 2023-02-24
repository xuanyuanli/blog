package com.example.springjdk17demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.invoke.CallSite;
import java.lang.invoke.LambdaMetafactory;
import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.lang.invoke.MethodHandles.Lookup;
import java.lang.invoke.MethodType;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;
import lombok.Data;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

interface InnerBook {

    default int getId() {
        return 10;
    }

    default long findById(long id) {
        return id;
    }
}

public class MethodHandleTest {

    @Test
    void direct() {
        String toBeTrimmed = " text with spaces ";
        System.out.println(toBeTrimmed.trim());

        Supplier<String> trimSupplier = toBeTrimmed::trim;
        System.out.println(trimSupplier.get());

        Function<String, String> trimFunc = String::trim;
        System.out.println(trimFunc.apply(toBeTrimmed));
    }

    @Test
    void reflection() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        String toBeTrimmed = " text with spaces ";
        Method reflectionMethod = String.class.getMethod("trim");
        Object invoke = reflectionMethod.invoke(toBeTrimmed);
        System.out.println(invoke);
    }

    @Test
    void methodHandle() throws Throwable {
        String toBeTrimmed = " text with spaces ";
        Lookup lookup = MethodHandles.lookup();
        MethodType mt = MethodType.methodType(String.class);
        MethodHandle mh = lookup.findVirtual(String.class, "trim", mt);
        Object invoke = mh.invoke(toBeTrimmed);
        System.out.println(invoke);
    }

    @Test
    void lambdametaFactory1() throws Throwable {
        String toBeTrimmed = " text with spaces ";
        Lookup lookup = MethodHandles.lookup();
        MethodType mt = MethodType.methodType(String.class);
        MethodHandle mh = lookup.findVirtual(String.class, "trim", mt);
        CallSite callSite = LambdaMetafactory.metafactory(lookup, "get", MethodType.methodType(Supplier.class, String.class),
                MethodType.methodType(Object.class), mh, MethodType.methodType(String.class));
        Supplier<String> lambda = (Supplier<String>) callSite.getTarget().bindTo(toBeTrimmed).invoke();
        System.out.println(lambda.get());
    }

    @Test
    void lambdametaFactory2() throws Throwable {
        String toBeTrimmed = " text with spaces ";
        Lookup lookup = MethodHandles.lookup();
        MethodType mt = MethodType.methodType(String.class);
        MethodHandle mh = lookup.findVirtual(String.class, "trim", mt);
        CallSite callSite = LambdaMetafactory.metafactory(lookup, "apply", MethodType.methodType(Function.class),
                MethodType.methodType(Object.class, Object.class), mh, MethodType.methodType(String.class, String.class));
        Function<String, String> trimFunc = (Function<String, String>) callSite.getTarget().invokeExact();
        System.out.println(trimFunc.apply(toBeTrimmed));
    }


    @Test
    void publicLookup() throws Throwable {
        Lookup publicLookup = MethodHandles.publicLookup();
        MethodType mt = MethodType.methodType(String.class, String.class);
        MethodHandle concatMH = publicLookup.findVirtual(String.class, "concat", mt);
        // 还有两个其他调用方法：1、invokeWithArguments方法，参数调用；2、invokeExact，入参需要是精确的参数，不会自动拆箱
        Object invoke = concatMH.invoke("a-", "1");
        Assertions.assertThat(invoke).isEqualTo("a-1");
    }

    @Test
    void staticLookup() throws Throwable {
        Lookup publicLookup = MethodHandles.publicLookup();
        MethodType mt = MethodType.methodType(List.class, Object[].class);
        MethodHandle asListMH = publicLookup.findStatic(Arrays.class, "asList", mt);
        List<String> invoke = (List<String>) asListMH.invoke("a-", "1");
        Assertions.assertThat(invoke).containsExactly("a-", "1");
    }

    @Test
    void constructorLookup() throws Throwable {
        Lookup publicLookup = MethodHandles.publicLookup();
        MethodType mt = MethodType.methodType(void.class, String.class);
        MethodHandle newIntegerMH = publicLookup.findConstructor(Integer.class, mt);
        Object invoke = newIntegerMH.invoke("15");
        Assertions.assertThat(invoke).isEqualTo(15);
    }

    @Test
    void fieldLookup() throws Throwable {
        Book book = new Book();
        book.setTitle("ab");
        Lookup lookup = MethodHandles.lookup();
        MethodHandle getTitleMH = lookup.findGetter(Book.class, "title", String.class);
        Object invoke = getTitleMH.invoke(book);
        Assertions.assertThat(invoke).isEqualTo("ab");
    }

    @Test
    void privateLookup() throws Throwable {
        Book book = new Book();
        book.setTitle("ab");
        book.setId("5");
        Lookup lookup = MethodHandles.lookup();
        Method formatBookMethod = Book.class.getDeclaredMethod("formatBook");
        formatBookMethod.setAccessible(true);
        MethodHandle formatBookMH = lookup.unreflect(formatBookMethod);
        Object invoke = formatBookMH.invoke(book);
        Assertions.assertThat(invoke).isEqualTo("5 > ab");
    }

    @Test
    void staticArrayLookup() throws Throwable {
        Lookup publicLookup = MethodHandles.publicLookup();
        MethodType mt = MethodType.methodType(boolean.class, Object.class);
        MethodHandle equals = publicLookup.findVirtual(String.class, "equals", mt);
        MethodHandle methodHandle = equals.asSpreader(Object[].class, 2);
        assertTrue((boolean) methodHandle.invoke(new Object[]{"java", "java"}));
    }

    @Test
    void bindLookup() throws Throwable {
        Lookup publicLookup = MethodHandles.publicLookup();
        MethodType mt = MethodType.methodType(String.class, String.class);
        MethodHandle concatMH = publicLookup.findVirtual(String.class, "concat", mt);
        MethodHandle bindedConcatMH = concatMH.bindTo("Hello ");
        assertEquals("Hello World!", bindedConcatMH.invoke("World!"));
    }

    @Test
    void publicInterfaceDefaultLookup() {
        Class<?> clazz = IBook.class;
        IBook ibook = (IBook) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{clazz},
                (proxy, method, args) -> MethodHandles.lookup().in(clazz).unreflectSpecial(method, clazz).bindTo(proxy).invokeWithArguments(args));
        assertEquals(10, ibook.getId());
    }

    /**
     * 因为反射调用了Lookup，所以必须添加jvm参数：--add-opens java.base/java.lang.invoke=ALL-UNNAMED
     */
    @Test
    void privateInterfaceDefaultLookup() {
        Class<?> clazz = InnerBook.class;
        InnerBook ibook = (InnerBook) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{clazz}, (proxy, method, args) -> {
            Constructor<Lookup> constructor = Lookup.class.getDeclaredConstructor(Class.class);
            constructor.setAccessible(true);
            return constructor.newInstance(clazz).in(clazz).unreflectSpecial(method, clazz).bindTo(proxy).invokeWithArguments(args);
        });
        assertEquals(10, ibook.getId());
    }

    public interface IBook {

        default int getId() {
            return 10;
        }

        default long findById(long id) {
            return id;
        }
    }


    @Data
    public static class Book {

        String id;
        String title;

        private String formatBook() {
            return id + " > " + title;
        }
    }
}

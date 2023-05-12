package com.example.springjdk17demo;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author John Li
 * @date 2023/5/12
 */
@Controller
public class HelloController {

    /**
     * 你好
     *
     * @return {@link String}
     */
    @GetMapping
    @ResponseBody
    public String hello(HttpServletResponse response) {
        return "hello";
    }
}

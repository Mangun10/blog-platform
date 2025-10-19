package com.example.blog_platform.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Controller
public class HomeController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }

    @GetMapping("/db-status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        Map<String, Object> status = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            status.put("status", "connected");
            status.put("database", connection.getMetaData().getDatabaseProductName());
            status.put("url", connection.getMetaData().getURL().replaceAll("password=[^&]*", "password=***"));
            status.put("driver", connection.getMetaData().getDriverName());
            status.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("status", "error");
            status.put("error", e.getMessage());
            status.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(status);
        }
    }

    @GetMapping("/health")
    @ResponseBody
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(health);
    }
}
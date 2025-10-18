package com.example.blog_platform.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin
public class FileController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"};
    private final String[] ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg"};

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file"));
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 10MB limit"));
            }

            String contentType = file.getContentType();
            if (!isAllowedFileType(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return file URL
            String fileUrl = "/uploads/" + uniqueFilename;
            Map<String, Object> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", originalFilename);
            response.put("size", file.getSize());
            response.put("type", contentType);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file"));
        }
    }

    private boolean isAllowedFileType(String contentType) {
        if (contentType == null) return false;
        
        for (String type : ALLOWED_IMAGE_TYPES) {
            if (contentType.equals(type)) return true;
        }
        for (String type : ALLOWED_VIDEO_TYPES) {
            if (contentType.equals(type)) return true;
        }
        return false;
    }
}
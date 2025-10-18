package com.example.blog_platform.controller;

import com.example.blog_platform.model.Subscriber;
import com.example.blog_platform.model.Post;
import com.example.blog_platform.repository.SubscriberRepository;
import com.example.blog_platform.repository.PostRepository;
import com.example.blog_platform.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class SubscriberController {

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, Object>> subscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String firstName = request.get("firstName");

        Map<String, Object> response = new HashMap<>();

        if (subscriberRepository.existsByEmail(email)) {
            response.put("success", false);
            response.put("message", "Email already subscribed!");
            return ResponseEntity.badRequest().body(response);
        }

        Subscriber subscriber = new Subscriber();
        subscriber.setEmail(email);
        subscriber.setFirstName(firstName);
        subscriber.setIsActive(true);

        subscriberRepository.save(subscriber);

        response.put("success", true);
        response.put("message", "Successfully subscribed! You'll receive new blog posts via email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Map<String, Object>> unsubscribe(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        Map<String, Object> response = new HashMap<>();
        Optional<Subscriber> subscriber = subscriberRepository.findByEmail(email);

        if (subscriber.isPresent()) {
            subscriber.get().setIsActive(false);
            subscriberRepository.save(subscriber.get());
            response.put("success", true);
            response.put("message", "Successfully unsubscribed!");
        } else {
            response.put("success", false);
            response.put("message", "Email not found in subscribers list!");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-post-email")
    public ResponseEntity<Map<String, Object>> sendPostToEmail(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        Long postId = Long.valueOf(request.get("postId").toString());

        Map<String, Object> response = new HashMap<>();

        Optional<Post> post = postRepository.findById(postId);
        if (post.isPresent()) {
            emailService.sendPostToEmail(email, post.get());
            response.put("success", true);
            response.put("message", "Blog post sent to your email successfully!");
        } else {
            response.put("success", false);
            response.put("message", "Blog post not found!");
        }

        return ResponseEntity.ok(response);
    }
}
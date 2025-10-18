package com.example.blog_platform.service;

import com.example.blog_platform.model.Post;
import com.example.blog_platform.model.Subscriber;
import com.example.blog_platform.repository.SubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EmailService {

    @Autowired
    private SubscriberRepository subscriberRepository;

    public void sendNewPostNotification(Post post) {
        List<Subscriber> activeSubscribers = subscriberRepository.findByIsActiveTrue();
        
        for (Subscriber subscriber : activeSubscribers) {
            sendEmailToSubscriber(subscriber, post);
        }
    }

    public void sendPostToEmail(String email, Post post) {
        // Send individual post to specific email
        sendEmailToAddress(email, post, false);
    }

    private void sendEmailToSubscriber(Subscriber subscriber, Post post) {
        String subject = "New Blog Post: " + post.getTitle();
        String content = createEmailContent(post, subscriber.getFirstName(), true);
        
        // Here you would integrate with actual email service (SendGrid, AWS SES, etc.)
        System.out.println("Sending email to: " + subscriber.getEmail());
        System.out.println("Subject: " + subject);
        System.out.println("Content: " + content);
    }

    private void sendEmailToAddress(String email, Post post, boolean isSubscriber) {
        String subject = "Blog Post: " + post.getTitle();
        String content = createEmailContent(post, null, false);
        
        // Here you would integrate with actual email service
        System.out.println("Sending post to: " + email);
        System.out.println("Subject: " + subject);
        System.out.println("Content: " + content);
    }

    private String createEmailContent(Post post, String firstName, boolean isNewsletter) {
        StringBuilder content = new StringBuilder();
        
        if (isNewsletter && firstName != null) {
            content.append("Hi ").append(firstName).append(",\n\n");
            content.append("We have a new blog post for you!\n\n");
        } else {
            content.append("Hello,\n\n");
            content.append("Here's the blog post you requested:\n\n");
        }
        
        content.append("Title: ").append(post.getTitle()).append("\n");
        content.append("Author: ").append(post.getAuthor()).append("\n");
        content.append("Category: ").append(post.getCategory()).append("\n");
        content.append("Reading Time: ").append(post.getReadingTime()).append(" minutes\n\n");
        
        if (post.getExcerpt() != null) {
            content.append("Summary: ").append(post.getExcerpt()).append("\n\n");
        }
        
        // Remove HTML tags for email content
        String cleanContent = post.getContent().replaceAll("<[^>]*>", "");
        if (cleanContent.length() > 500) {
            cleanContent = cleanContent.substring(0, 500) + "...";
            content.append("Preview: ").append(cleanContent).append("\n\n");
            content.append("Read the full post at: https://manas-gunti-blog.up.railway.app/\n");
        } else {
            content.append("Content: ").append(cleanContent).append("\n");
        }
        
        if (isNewsletter) {
            content.append("\n\nThanks for subscribing to our blog!\n");
            content.append("Visit our blog: https://manas-gunti-blog.up.railway.app/");
        }
        
        return content.toString();
    }
}
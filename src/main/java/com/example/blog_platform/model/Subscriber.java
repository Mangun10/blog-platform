package com.example.blog_platform.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Represents an email subscriber entity for blog notifications
 */
@Entity
@Table(name = "subscribers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "subscribed_date", updatable = false)
    private LocalDateTime subscribedDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "first_name")
    private String firstName;

    @PrePersist
    protected void onCreate() {
        this.subscribedDate = LocalDateTime.now();
    }
}
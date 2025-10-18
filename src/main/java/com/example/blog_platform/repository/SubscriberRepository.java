package com.example.blog_platform.repository;

import com.example.blog_platform.model.Subscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    Optional<Subscriber> findByEmail(String email);

    List<Subscriber> findByIsActiveTrue();

    boolean existsByEmail(String email);
}
package com.example.blog_platform.repository;

import com.example.blog_platform.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for managing Post entities.
 *
 * By extending JpaRepository, Spring Data JPA automatically provides
 * common CRUD (Create, Read, Update, Delete) methods.
 * You can also define custom query methods here, and Spring will
 * automatically generate the implementation for you based on the method name.
 */
@Repository // Marks this interface as a Spring repository component
public interface PostRepository extends JpaRepository<Post, Long> {

    // You can add custom query methods here. For example:
    // List<Post> findByAuthor(String author);
    // This method would automatically be implemented by Spring to find posts by a
    // specific author.
}

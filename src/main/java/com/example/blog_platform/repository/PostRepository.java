package com.example.blog_platform.repository;

import com.example.blog_platform.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

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

    // Find posts by category
    List<Post> findByCategoryIgnoreCase(String category);

    // Search posts by title, content, author, or category
    @Query("SELECT p FROM Post p WHERE " +
            "LOWER(p.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.author) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Post> searchPosts(@Param("searchTerm") String searchTerm);

    // Get all distinct categories
    @Query("SELECT DISTINCT p.category FROM Post p ORDER BY p.category")
    List<String> findAllCategories();
}

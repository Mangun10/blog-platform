package com.example.blog_platform.repository;

import com.example.blog_platform.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * A repository interface for Comment entities.
 * Spring Data JPA automatically provides a wide range of CRUD methods
 * for the Comment entity, such as save(), findById(), and findAll().
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
}

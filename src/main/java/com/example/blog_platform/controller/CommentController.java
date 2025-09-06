package com.example.blog_platform.controller;

import com.example.blog_platform.model.Comment;
import com.example.blog_platform.model.Post;
import com.example.blog_platform.repository.CommentRepository;
import com.example.blog_platform.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for handling comments.
 * It exposes endpoints for retrieving, creating, and updating comments.
 */
@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @Autowired
    public CommentController(PostRepository postRepository, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * Retrieves all comments for a specific post.
     *
     * @param postId The ID of the post.
     * @return A list of comments for the specified post.
     */
    @GetMapping
    public ResponseEntity<List<Comment>> getCommentsByPostId(@PathVariable Long postId) {
        if (!postRepository.existsById(postId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Post post = postRepository.findById(postId).orElse(null);
        return new ResponseEntity<>(post.getComments(), HttpStatus.OK);
    }

    /**
     * Creates a new comment for a specific post.
     *
     * @param postId  The ID of the post.
     * @param comment The comment object to be created.
     * @return The created comment object with a 201 Created status.
     */
    @PostMapping
    public ResponseEntity<Comment> createComment(@PathVariable Long postId, @RequestBody Comment comment) {
        return postRepository.findById(postId).map(post -> {
            comment.setPost(post);
            return new ResponseEntity<>(commentRepository.save(comment), HttpStatus.CREATED);
        }).orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Updates an existing comment for a specific post.
     *
     * @param postId         The ID of the post.
     * @param commentId      The ID of the comment.
     * @param updatedComment The updated comment object with new data.
     * @return The updated comment object with a 200 OK status.
     */
    @PatchMapping("/{commentId}")
    public ResponseEntity<Comment> updateComment(@PathVariable Long postId, @PathVariable Long commentId,
            @RequestBody Comment updatedComment) {
        if (!postRepository.existsById(postId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return commentRepository.findById(commentId).map(comment -> {
            // Update fields only if they are not null
            if (updatedComment.getAuthor() != null) {
                comment.setAuthor(updatedComment.getAuthor());
            }
            if (updatedComment.getContent() != null) {
                comment.setContent(updatedComment.getContent());
            }

            return new ResponseEntity<>(commentRepository.save(comment), HttpStatus.OK);
        }).orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Deletes a comment by its ID.
     *
     * @param commentId The ID of the comment to delete.
     * @return A 204 No Content status if successful, or 404 Not Found.
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        if (commentRepository.existsById(commentId)) {
            commentRepository.deleteById(commentId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}

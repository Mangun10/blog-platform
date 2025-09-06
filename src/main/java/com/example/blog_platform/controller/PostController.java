package com.example.blog_platform.controller;

import com.example.blog_platform.model.Post;
import com.example.blog_platform.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for handling all blog post-related API requests.
 *
 * This class exposes endpoints for creating, reading, updating, and deleting
 * blog posts.
 * The @RestController annotation combines @Controller and @ResponseBody,
 * indicating
 * that this class will handle web requests and the return values will be bound
 * to
 * the web response body.
 */
@RestController
@RequestMapping("/api/posts") // Maps all requests to this controller to the /api/posts path
@CrossOrigin // Allows requests from all origins for development
public class PostController {

    private final PostRepository postRepository;

    /**
     * Constructor for dependency injection. Spring automatically provides an
     * instance
     * of PostRepository, a core concept known as Inversion of Control (IoC).
     *
     * @param postRepository The repository to handle database operations for posts.
     */
    @Autowired
    public PostController(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    /**
     * Endpoint to get all blog posts.
     *
     * @return A list of all posts.
     */
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return new ResponseEntity<>(postRepository.findAll(), HttpStatus.OK);
    }

    /**
     * Endpoint to get a single post by its ID.
     *
     * @param id The ID of the post.
     * @return A ResponseEntity containing the post if found, or a 404 Not Found
     *         status.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(post -> new ResponseEntity<>(post, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Endpoint to create a new post.
     *
     * @param post The post to be created.
     * @return The created post with its generated ID.
     */
    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return new ResponseEntity<>(postRepository.save(post), HttpStatus.CREATED);
    }

    /**
     * Endpoint to update an existing post with new data.
     *
     * @param id          The ID of the post.
     * @param updatedPost The updated post object.
     * @return The updated post object with a 200 OK status.
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post updatedPost) {
        return postRepository.findById(id).map(post -> {
            // Update fields only if they are not null in the request body
            if (updatedPost.getTitle() != null) {
                post.setTitle(updatedPost.getTitle());
            }
            if (updatedPost.getContent() != null) {
                post.setContent(updatedPost.getContent());
            }
            if (updatedPost.getAuthor() != null) {
                post.setAuthor(updatedPost.getAuthor());
            }

            return new ResponseEntity<>(postRepository.save(post), HttpStatus.OK);
        }).orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Endpoint to delete a post by its ID.
     *
     * @param id The ID of the post to delete.
     * @return A ResponseEntity with a 204 No Content status if successful.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (postRepository.existsById(id)) {
            postRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}

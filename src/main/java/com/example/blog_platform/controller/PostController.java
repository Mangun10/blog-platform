package com.example.blog_platform.controller;

import com.example.blog_platform.model.Post;
import com.example.blog_platform.repository.PostRepository;
import com.example.blog_platform.service.EmailService;
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
    
    @Autowired
    private EmailService emailService;

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
        Post savedPost = postRepository.save(post);
        
        // Send email notification to subscribers
        try {
            emailService.sendNewPostNotification(savedPost);
        } catch (Exception e) {
            System.err.println("Failed to send email notifications: " + e.getMessage());
        }
        
        return new ResponseEntity<>(savedPost, HttpStatus.CREATED);
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

    /**
     * Get all posts by category
     * 
     * @param category The category to filter by
     * @return List of posts in the specified category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Post>> getPostsByCategory(@PathVariable String category) {
        List<Post> posts = postRepository.findByCategoryIgnoreCase(category);
        return new ResponseEntity<>(posts, HttpStatus.OK);
    }

    /**
     * Search posts by term (searches title, content, author, and category)
     * 
     * @param searchTerm The term to search for
     * @return List of posts matching the search term
     */
    @GetMapping("/search")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String searchTerm) {
        List<Post> posts = postRepository.searchPosts(searchTerm);
        return new ResponseEntity<>(posts, HttpStatus.OK);
    }

    /**
     * Get all available categories
     * 
     * @return List of all distinct categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = postRepository.findAllCategories();
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }

    /**
     * Like a blog post
     * 
     * @param id The ID of the post to like
     * @return The updated post with incremented likes
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<Post> likePost(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(post -> {
                    post.setLikes(post.getLikes() + 1);
                    return new ResponseEntity<>(postRepository.save(post), HttpStatus.OK);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Share a blog post (increment share count)
     * 
     * @param id The ID of the post to share
     * @return The updated post with incremented shares
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<Post> sharePost(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(post -> {
                    post.setShares(post.getShares() + 1);
                    return new ResponseEntity<>(postRepository.save(post), HttpStatus.OK);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}

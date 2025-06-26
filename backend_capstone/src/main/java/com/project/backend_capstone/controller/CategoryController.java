package com.project.backend_capstone.controller;

import com.project.backend_capstone.service.CategoryService;
import com.project.backend_capstone.dto.AddCategoryRequest;
import com.project.backend_capstone.dto.UpdateCategoryRequest;
import com.project.backend_capstone.model.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // Add a category
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/categories")
    public ResponseEntity<String> addCategory(@RequestBody AddCategoryRequest request) {
        try {
            categoryService.addCategory(request);
            return ResponseEntity.ok("Item added successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding category: " + e.getMessage());
        }
    }

    // Get all categories
    @GetMapping("/api/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        try {
            List<Category> categories = categoryService.getAccessibleCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Get a category by ID
    @GetMapping("/api/categories/{categoryId}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String categoryId) {
        try {
            Category category = categoryService.getCategoryById(categoryId);
            if (category == null) {
                // Return 404 if the category is not found
                return ResponseEntity.status(404).body(null);
            }
            return ResponseEntity.ok(category);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Get ALL raw categories without caring about the model - to be deleted later
    @GetMapping("/api/allcategories")
    public ResponseEntity<List<Map<String, Object>>> getALLCategories() {
        try {
            List<Map<String, Object>> categories = categoryService.getALLCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of(Map.of(
                            "error", "Error getting all categories: " + e.getMessage())));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/approveCategory")
    public ResponseEntity<String> approveCategory(@RequestParam String categoryId,
            @RequestParam String status,
            @RequestParam String approvedBy) {
        try {
            categoryService.approveCategory(categoryId, status, approvedBy);
            return ResponseEntity.ok("Category approved successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error approving category: " + e.getMessage());
        }
    }

    // Update a category
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/api/categories/{categoryId}")
    public ResponseEntity<String> updateCategory(@RequestBody UpdateCategoryRequest request) {
        try {
            categoryService.updateCategory(request);
            return ResponseEntity.ok("Category updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating category: " + e.getMessage());
        }
    }

    // Request Approval for a category
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/api/categories/requestApproval")
    public ResponseEntity<String> requestApproval(@RequestParam String categoryId) {
        try {
            categoryService.requestApproval(categoryId);
            return ResponseEntity.ok("Category approval requested successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error requesting category approval: " + e.getMessage());
        }
    }

    // Delete a category (for testing purposes)
    @DeleteMapping("/api/categories/{categoryId}")
    public ResponseEntity<String> deleteCategory(@PathVariable String categoryId) {
        try {
            categoryService.deleteCategory(categoryId);
            return ResponseEntity.ok("Category deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting category: " + e.getMessage());
        }
    }
}
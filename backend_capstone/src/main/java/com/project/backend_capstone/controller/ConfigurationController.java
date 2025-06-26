package com.project.backend_capstone.controller;

import java.util.List;

import org.apache.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.backend_capstone.dto.AddConfigurationRequest;
import com.project.backend_capstone.dto.UpdateConfigurationRequest;
import com.project.backend_capstone.model.Configuration;
import com.project.backend_capstone.service.ConfigurationService;

@RestController
@RequestMapping("/api/configuration")
public class ConfigurationController {
    @Autowired
    private ConfigurationService configurationService;

    @PostMapping("/addConfiguration")
    public ResponseEntity<String> addConfiguration(
            @RequestBody AddConfigurationRequest request // Use a class to handle request body
    ) {
        try {
            // Call the service to add the configuration using the configRequest
            configurationService.addConfiguration(request);
            return ResponseEntity.ok("Configuration added successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error adding configuration: " + e.getMessage());
        }
    }

    // Get all configurations for a specific category
    @GetMapping("/getConfigurationsByCategory")
    public ResponseEntity<List<Configuration>> getConfigurationsByCategory(
            @RequestParam String category_id) {
        try {
            // Query the configurations by categoryId
            List<Configuration> configurations = configurationService.getConfigurationsByCategory(category_id);

            if (configurations.isEmpty()) {
                // Return 204 No Content if there are no configurations for the category
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(configurations); // Return 200 OK with the list of configurations
        } catch (Exception e) {
            // Return Error if an exception occurs
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/getAllConfigurations")
    public ResponseEntity<List<Configuration>> getAllConfigurations() {
        try {
            List<Configuration> configurations = configurationService.getAllConfigurations();
            if (configurations.isEmpty()) {
                // Return 204 No Content if there are no configurations
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(configurations); // Return 200 OK with the list of configurations
        } catch (Exception e) {
            // Return Error if an exception occurs
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/approveConfiguration")
    public ResponseEntity<String> approveConfiguration(
            @RequestParam String configurationId,
            @RequestParam String status,
            @RequestParam String approvedBy) {
        try {
            // Call the service method to approve the configuration
            configurationService.approveConfiguration(configurationId, status, approvedBy);
            return ResponseEntity.ok("Configuration approved successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error approving configuration: " + e.getMessage());
        }
    }

    // Update a configuration (creates a new version)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/updateConfiguration")
    public ResponseEntity<String> updateConfiguration(
            @RequestBody UpdateConfigurationRequest updateRequest) {
        try {
            // Call the service method to update the configuration
            configurationService.updateConfiguration(updateRequest);
            return ResponseEntity.ok("Configuration updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error updating configuration: " + e.getMessage());
        }
    }

    // Retire a configuration (all versions of it)
    @PutMapping("/retireConfiguration")
    public ResponseEntity<String> retireConfiguration(
            @RequestParam String configurationId) {
        try {
            configurationService.retireConfiguration(configurationId);
            return ResponseEntity.ok("All versions of configuration retired successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error retiring all configuration versions: " + e.getMessage());
        }
    }

    // Delete a configuration: For testing purposes
    @DeleteMapping("/deleteConfiguration")
    public ResponseEntity<String> deleteConfiguration(
            @RequestParam String categoryId,
            @RequestParam String configurationId) {
        try {
            configurationService.deleteConfiguration(categoryId, configurationId);
            return ResponseEntity.ok("Configuration deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error deleting configuration: " + e.getMessage());
        }
    }

    // Delete all configurations: For testing purposes
    @DeleteMapping("/deleteAllConfigurations")
    public ResponseEntity<String> deleteAllConfigurations() {
        try {
            configurationService.deleteAllConfigurations();
            return ResponseEntity.ok("All configurations deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("Error deleting all configurations: " + e.getMessage());
        }
    }
}

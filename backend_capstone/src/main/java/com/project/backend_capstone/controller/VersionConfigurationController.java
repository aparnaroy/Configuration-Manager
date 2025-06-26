package com.project.backend_capstone.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.project.backend_capstone.model.VersionConfiguration;
import com.project.backend_capstone.service.VersionConfigService;
import com.project.backend_capstone.dto.AddVersionConfigRequest;
import com.project.backend_capstone.dto.UpdateVersionConfigRequest;

@RestController
public class VersionConfigurationController {

    @Autowired
    private VersionConfigService versionConfigService;

    // Add a config version
    @PostMapping("/api/configVersions")
    public ResponseEntity<String> addConfigVersion(@RequestBody AddVersionConfigRequest request) {
        try {
            versionConfigService.addVersionConfiguration(
                    request.getConfigurationId(),
                    request.getStatus(),
                    request.getApprovedBy(),
                    request.getCreatedBy(),
                    request.getDescription(),
                    request.getFields());
            return ResponseEntity.ok("Config Version added successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding config version: " + e.getMessage());
        }
    }

    // Get all config versions
    // @GetMapping("/api/configVersions")
    // public List<VersionConfiguration> getAllConfigVersions() {
    // return versionConfigService.getAllConfigVersions();
    // }

    // Get all versions of a specific config
    @GetMapping("/api/configVersions/{configId}")
    public List<VersionConfiguration> getConfigVersions(@PathVariable String configId) {
        return versionConfigService.getConfigVersions(configId);
    }

    // Get ALL raw config versions without caring about the model
    @GetMapping("/api/allConfigVersions")
    public List<Map<String, Object>> getALLConfigVersions() {
        return versionConfigService.getALLConfigVersions();
    }

    // Update a config version
    @PutMapping("/api/configVersions/{configId}/{versionNum}")
    public ResponseEntity<String> updateConfigVersion(
            @PathVariable String configId,
            @PathVariable Integer versionNum,
            @RequestBody UpdateVersionConfigRequest request) {
        try {
            versionConfigService.updateVersionConfiguration(configId, versionNum, request);
            return ResponseEntity.ok("Config Version updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating config version: " + e.getMessage());
        }
    }

    // Delete all version configurations: For testing purposes
    @DeleteMapping("/api/deleteAllVersionConfigurations")
    public ResponseEntity<String> deleteAllVersionConfigurations() {
        try {
            versionConfigService.deleteAllVersionConfigurations();
            return ResponseEntity.ok("All version configurations deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting all version configurations: " + e.getMessage());
        }
    }
}

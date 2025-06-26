package com.project.backend_capstone.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.project.backend_capstone.model.Version;
import com.project.backend_capstone.service.VersionService;

@RestController
public class VersionController {

    @Autowired
    private VersionService versionService;

    // Get all versions
    @GetMapping("/api/versions")
    public List<Version> getAllVersions() {
        return versionService.getAllVersions();
    }

    // Get all versions of a specific category
    @GetMapping("/api/versions/{categoryId}")
    public List<Version> getAllCategoryVersions(@PathVariable String categoryId) {
        return versionService.getAllCategoryVersions(categoryId);
    }

    // Get ALL raw versions without caring about the model
    @GetMapping("/api/allversions")
    public List<Map<String, Object>> getALLVersions() {
        return versionService.getALLVersions();
    }
}

package com.project.backend_capstone.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBQueryExpression;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBScanExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.project.backend_capstone.dto.AddCategoryRequest;
import com.project.backend_capstone.dto.UpdateCategoryRequest;
import com.project.backend_capstone.enums.CategoryStatus;
import com.project.backend_capstone.model.Category;
import com.project.backend_capstone.model.UserGroup;
import com.project.backend_capstone.model.Configuration;
import com.project.backend_capstone.model.Version;
import com.project.backend_capstone.utils.JSONUtils;

@Service
public class CategoryService {
    private final DynamoDBMapper dynamoDBMapper;
    private final AmazonDynamoDB amazonDynamoDB;

    @Autowired
    private VersionService versionService;

    @Autowired
    private UserGroupService userGroupService;

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    public CategoryService(DynamoDBMapper dynamoDBMapper, AmazonDynamoDB amazonDynamoDB) {
        this.dynamoDBMapper = dynamoDBMapper;
        this.amazonDynamoDB = amazonDynamoDB;
    }

    // Add a category
    public void addCategory(AddCategoryRequest request) {
        // 1. Check if the category already exists
        List<Category> categories = dynamoDBMapper.scan(Category.class, new DynamoDBScanExpression());
        for (Category category : categories) {
            if (category.getName() != null && category.getName().equalsIgnoreCase(request.getName())) {
                throw new RuntimeException("Category already exists with name: " + request.getName());
            }
        }

        // 2. Create a new category
        Category category = new Category();
        category.setCategoryId(UUID.randomUUID().toString());
        category.setName(request.getName());

        // 3. Save the new category
        dynamoDBMapper.save(category);

        // 4. Serialize schema and create first version
        String serializedSchema;
        try {
            serializedSchema = JSONUtils.serialize(request.getSchema());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize schema", e);
        }

        versionService.addVersion(category.getCategoryId(), request.getDescription(), request.getCreatedBy(),
                serializedSchema);
    }

    // Get all categories
    public List<Category> getAccessibleCategories() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        if (isAdmin()) {
            return dynamoDBMapper.scan(Category.class, new DynamoDBScanExpression());
        } else {
            // return dynamoDBMapper.scan(Category.class, new DynamoDBScanExpression());
            List<String> userGroupIds = userGroupService.getUserGroupIds(username);
            Set<String> accessibleCategoryIds = new HashSet<>();

            // Loop through the user group IDs and gather categories the user has access to
            for (String groupId : userGroupIds) {
                DynamoDBQueryExpression<UserGroup> queryExpression = new DynamoDBQueryExpression<UserGroup>()
                        .withHashKeyValues(new UserGroup() {
                            {
                                setUser_group_id(groupId);
                            }
                        });

                List<UserGroup> matchingGroups = dynamoDBMapper.query(UserGroup.class, queryExpression);

                for (UserGroup userGroup : matchingGroups) {
                    if (userGroup.getCategory_access() != null) {
                        accessibleCategoryIds.addAll(userGroup.getCategory_access());
                    }
                }
            }

            List<Category> accessibleCategories = new ArrayList<>();
            for (String categoryId : accessibleCategoryIds) {
                Category category = dynamoDBMapper.load(Category.class, categoryId);
                if (category != null) {
                    accessibleCategories.add(category);
                }
            }
            return accessibleCategories;
        }
    }

    // Check if the current user is an admin
    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
    }

    public Category getCategoryById(String categoryId) {
        return dynamoDBMapper.load(Category.class, categoryId);
    }

    // Get ALL raw categories without caring about the model
    public List<Map<String, Object>> getALLCategories() {
        ScanRequest scanRequest = new ScanRequest().withTableName("Category");
        ScanResult result = amazonDynamoDB.scan(scanRequest);

        List<Map<String, Object>> cleanedItems = new ArrayList<>();

        // Filter out unnecessary AWS metadata for attributes
        for (Map<String, AttributeValue> item : result.getItems()) {
            Map<String, Object> cleanedItem = new HashMap<>();

            // Iterate over each attribute in the category item
            for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {
                String attributeName = entry.getKey();
                AttributeValue attributeValue = entry.getValue();

                // Extract the value based on the type of AttributeValue (e.g., string, list)
                if (attributeValue.getS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getS()); // If it's a string
                } else if (attributeValue.getN() != null) {
                    cleanedItem.put(attributeName, Integer.parseInt(attributeValue.getN())); // If it's a number
                } else if (attributeValue.getB() != null) {
                    cleanedItem.put(attributeName, attributeValue.getB()); // If it's binary
                } else if (attributeValue.getSS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getSS()); // If it's a string set
                } else if (attributeValue.getNS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getNS()); // If it's a number set
                } else if (attributeValue.getL() != null) {
                    // If it's a list of strings
                    List<String> listValues = attributeValue.getL().stream()
                            .map(AttributeValue::getS)
                            .toList();
                    cleanedItem.put(attributeName, listValues);
                }
            }
            cleanedItems.add(cleanedItem);
        }
        return cleanedItems;
    }

    // Approve a category
    public void approveCategory(String categoryId, String status, String approvedBy) {
        // Get the category
        Category category = dynamoDBMapper.load(Category.class, categoryId);

        // Throw exception if the category does not exist
        if (category == null) {
            throw new RuntimeException("Category does not exist with ID: " + categoryId);
        }

        dynamoDBMapper.save(category);

        // Get the latest category version
        Version latestVersion = versionService.getLatestCategoryVersion(categoryId);
        if (latestVersion == null) {
            throw new RuntimeException("No versions found for category ID: " + categoryId);
        }

        // Get all configurations for this category
        List<Configuration> allCategoryConfigs = configurationService.getConfigurationsByCategory(categoryId);

        // Update the status of all versions
        versionService.getAllCategoryVersions(categoryId).forEach(version -> {
            if (version.getVersionId().equals(latestVersion.getVersionId())) {
                version.setStatus(CategoryStatus.APPROVED.getStatus()); // Set latest version to
                                                                        // CategoryStatus.APPROVED.getStatus()
                version.setApprovedBy(approvedBy);
                version.setApprovedDate(Instant.now().toString());
            } else {
                version.setStatus(CategoryStatus.RETIRED.getStatus()); // Retire all previous versions

                // Find and retire all configurations (all their versions) of these previous
                // (now retired) category versions
                Integer versionNumToRetire = version.getVersionNum();
                allCategoryConfigs.stream()
                        .filter(config -> config.getCategoryVersion() != null &&
                                config.getCategoryVersion().equals(versionNumToRetire))
                        .forEach(config -> configurationService.retireConfiguration(config.getConfigurationId()));
            }
            versionService.updateVersion(version);
        });
    }

    // Update a category
    public void updateCategory(UpdateCategoryRequest request) {
        // Get the category
        Category category = dynamoDBMapper.load(Category.class, request.getCategoryId());

        // Throw exception if the category does not exist
        if (category == null) {
            throw new RuntimeException("Category does not exist with ID: " + request.getCategoryId());
        }

        // Find the latest version of the category
        Version latestVersion = versionService.getLatestCategoryVersion(request.getCategoryId());
        latestVersion.setDescription(request.getDescription());
        String serializedSchema;
        try {
            serializedSchema = JSONUtils.serialize(request.getSchema());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize schema", e);
        }
        latestVersion.setSchema(serializedSchema);

        if (request.getStatus().equals(CategoryStatus.RETIRED.getStatus())) {
            // Retire this version and the previous one if needed
            List<Version> allVersions = versionService.getAllCategoryVersions(request.getCategoryId());
            List<Configuration> allCategoryConfigs = configurationService
                    .getConfigurationsByCategory(request.getCategoryId());

            for (Version version : allVersions) {
                version.setStatus(CategoryStatus.RETIRED.getStatus());
                versionService.updateVersion(version);

                // Retire all configurations linked to the category version
                for (Configuration config : allCategoryConfigs) {
                    if (config.getCategoryVersion() != null
                            && config.getCategoryVersion().equals(version.getVersionNum())) {
                        configurationService.retireConfiguration(config.getConfigurationId());
                    }
                }
            }
        }
        // Check if the latest version is CategoryStatus.APPROVED.getStatus()
        else if (latestVersion.getStatus().equals(CategoryStatus.APPROVED.getStatus())) {
            // Create a new version with the same description and status
            versionService.addVersion(request.getCategoryId(), request.getDescription(), request.getCreatedBy(),
                    serializedSchema);
        } else {
            if (latestVersion.getStatus().equals(CategoryStatus.PENDING_APPROVAL.getStatus())) {
                latestVersion.setStatus(CategoryStatus.IN_EDITING.getStatus()); // Set to "In Editing"
            }
            // update the category
            versionService.updateVersion(latestVersion);
        }
    }

    // Restart a category cycle status starting from "In Editing"
    public void restartCategoryCycle(UpdateCategoryRequest request) {
        // Get the category
        Category category = dynamoDBMapper.load(Category.class, request.getCategoryId());

        // Throw exception if the category does not exist
        if (category == null) {
            throw new RuntimeException("Category does not exist with ID: " + request.getCategoryId());
        }

        // Create a new version for the category
        // Check if the category has already been approved
        List<Version> versions = versionService.getAllCategoryVersions(request.getCategoryId());
        if (versions.isEmpty()) {
            throw new RuntimeException("No versions found for category ID: " + request.getCategoryId());
        }
        // Find the latest version of the category
        Version latestVersion = Collections.max(versions, Comparator.comparingInt(Version::getVersionNum));
        // Check if the latest version is CategoryStatus.APPROVED.getStatus()
        if (latestVersion.getStatus().equals(CategoryStatus.APPROVED.getStatus())) {

            String serializedSchema;
            try {
                serializedSchema = JSONUtils.serialize(request.getSchema());
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to serialize schema", e);
            }

            // Create a new version with the same description, status, and schema
            versionService.addVersion(request.getCategoryId(), request.getDescription(), request.getCreatedBy(),
                    serializedSchema);
        } else {
            throw new RuntimeException("Category is not in an approved state to restart the cycle.");
        }
    }

    public void requestApproval(String categoryId) {
        // Get the category
        Category category = dynamoDBMapper.load(Category.class, categoryId);

        // Throw exception if the category does not exist
        if (category == null) {
            throw new RuntimeException("Category does not exist with ID: " + categoryId);
        }

        // Get the latest version of the category
        Version latestVersion = versionService.getLatestCategoryVersion(categoryId);
        // if (latestVersion == null) {
        // throw new RuntimeException("No versions found for category ID: " +
        // categoryId);
        // }
        if (latestVersion.getStatus().equals(CategoryStatus.APPROVED.getStatus())) {
            throw new RuntimeException("Category is already approved with ID: " + categoryId);
        } else if (latestVersion.getStatus().equals(CategoryStatus.IN_EDITING.getStatus())) {
            latestVersion.setStatus(CategoryStatus.PENDING_APPROVAL.getStatus());
            versionService.updateVersion(latestVersion);
        } else {
            throw new RuntimeException("Category is not in an editable state to request approval.");
        }

    }

    // Delete a category (for testing purposes)
    public void deleteCategory(String categoryId) {
        // Load and verify the category exists
        Category category = dynamoDBMapper.load(Category.class, categoryId);
        if (category == null) {
            throw new RuntimeException("Category not found with ID: " + categoryId);
        }

        // Delete all associated configurations
        List<Configuration> configurations = configurationService.getConfigurationsByCategory(categoryId);
        for (Configuration config : configurations) {
            configurationService.deleteConfiguration(config.getCategoryId(), config.getConfigurationId());
        }

        // Delete the category itself
        dynamoDBMapper.delete(category);
    }
}
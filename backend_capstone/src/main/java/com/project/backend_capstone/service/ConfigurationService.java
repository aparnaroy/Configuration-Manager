package com.project.backend_capstone.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBScanExpression;
import com.amazonaws.services.dynamodbv2.datamodeling.PaginatedScanList;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.project.backend_capstone.dto.AddConfigurationRequest;
import com.project.backend_capstone.dto.UpdateConfigurationRequest;
import com.project.backend_capstone.enums.CategoryStatus;
import com.project.backend_capstone.model.Configuration;
import com.project.backend_capstone.model.VersionConfiguration;

@Service
public class ConfigurationService {

    private final DynamoDBMapper dynamoDBMapper;

    @Autowired
    private VersionConfigService versionConfigService;

    @Autowired
    public ConfigurationService(AmazonDynamoDB amazonDynamoDB, DynamoDBMapper dynamoDBMapper) {
        this.dynamoDBMapper = dynamoDBMapper;
        System.out.println("UserService initialized: " + amazonDynamoDB);
    }

    // Add a configuration
    public void addConfiguration(AddConfigurationRequest configRequest) {
        // Retrieve all configuration records from DB that match the category_id using
        // query
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":category_id", new AttributeValue().withS(configRequest.getCategoryId()));
        // create a query expression to get all configuration records that matches the
        // category_id
        DynamoDBScanExpression scanExpression = new DynamoDBScanExpression()
                .withFilterExpression("category_id = :category_id").withExpressionAttributeValues(eav);
        List<Configuration> configurations = dynamoDBMapper.scan(Configuration.class, scanExpression);
        // Check if the configuration of the same name already exists
        for (Configuration configuration : configurations) {
            if (configuration.getName().equalsIgnoreCase(configRequest.getName())) {
                throw new RuntimeException("Configuration already exists with name: " + configRequest.getName());
            }
        }

        // Create a new configuration
        Configuration configuration = new Configuration();
        configuration.setCategoryId(configRequest.getCategoryId());
        configuration.setCategoryVersion(configRequest.getCategoryVersion());
        configuration.setName(configRequest.getName());
        configuration.setConfigurationId(UUID.randomUUID().toString()); // Generate a unique configuration_id

        dynamoDBMapper.save(configuration);

        // Create the 1st version for the new configuration (w/ approved By + Date null)
        versionConfigService.addVersionConfiguration(configuration.getConfigurationId(), configRequest.getStatus(),
                null, configRequest.getCreatedBy(),
                configRequest.getDescription(), configRequest.getFields());
    }

    // Get a configuration by category and name
    public Configuration getConfigurationByCategoryIdAndName(String category_id, String name) {
        // Attempt to load the configuration from DynamoDB
        Configuration configuration = dynamoDBMapper.load(Configuration.class, category_id, name);

        // Check if the configuration was found
        if (configuration == null) {
            // Log if no configuration is found
            System.out.println("DEBUG: No configuration found for categoryId: " + category_id + " and name: " + name);
        } else {
            // Log the found configuration
            System.out.println("DEBUG: Found configuration: " + configuration);
        }

        // Return the configuration (null if not found)
        return configuration;
    }

    // Get all configurations for a specific category
    public List<Configuration> getConfigurationsByCategory(String category_id) {
        Map<String, AttributeValue> eav = new HashMap<>();
        eav.put(":category_id", new AttributeValue().withS(category_id));
        // create a query expression to get all configuration records that matches the
        // category_id
        DynamoDBScanExpression scanExpression = new DynamoDBScanExpression()
                .withFilterExpression("category_id = :category_id").withExpressionAttributeValues(eav);
        List<Configuration> configurations = dynamoDBMapper.scan(Configuration.class, scanExpression);
        return configurations;
    }

    // Get all configurations
    public List<Configuration> getAllConfigurations() {
        PaginatedScanList<Configuration> paginatedScanList = dynamoDBMapper.scan(Configuration.class,
                new DynamoDBScanExpression());
        return paginatedScanList;
    }

    // Approve a configuration
    public void approveConfiguration(String configurationId, String status, String approvedBy) {
        versionConfigService.approveConfiguration(configurationId, status, approvedBy);
    }

    // Update a configuration (creates a new version)
    public Configuration updateConfiguration(UpdateConfigurationRequest updateRequest) {
        // Load the config
        Configuration configuration = dynamoDBMapper.load(Configuration.class, updateRequest.getCategoryId(),
                updateRequest.getConfigurationId());

        if (configuration == null) {
            throw new RuntimeException("Configuration does not exist with ID: " + updateRequest.getConfigurationId());
        }

        // Get all versions of the config
        List<VersionConfiguration> versions = versionConfigService
                .getConfigVersions(updateRequest.getConfigurationId());

        if (versions == null || versions.isEmpty()) {
            throw new RuntimeException("No versions found for Configuration ID: " + updateRequest.getConfigurationId());
        }

        // Add a new config version
        versionConfigService.addVersionConfiguration(
                updateRequest.getConfigurationId(),
                CategoryStatus.IN_EDITING.getStatus(), // Set status to "In Editing" for the new version
                null, // approvedBy is null for new versions,
                updateRequest.getCreatedBy(),
                updateRequest.getDescription(),
                updateRequest.getFields());

        return configuration;
    }

    // Retire a configuration (all versions of it)
    public void retireConfiguration(String configurationId) {
        // Get all versions of the config
        List<VersionConfiguration> versions = versionConfigService.getConfigVersions(configurationId);

        if (versions == null || versions.isEmpty()) {
            throw new RuntimeException("No versions found for configuration ID: " + configurationId);
        }

        // Set each version to Retired status
        for (VersionConfiguration version : versions) {
            version.setStatus(CategoryStatus.RETIRED.getStatus());
            dynamoDBMapper.save(version);
        }
    }

    // Delete a configuration: For testing purposes
    public void deleteConfiguration(String categoryId, String configurationId) {
        Configuration config = dynamoDBMapper.load(Configuration.class, categoryId, configurationId);

        if (config == null) {
            throw new RuntimeException("Configuration not found with ID: " + configurationId);
        }

        dynamoDBMapper.delete(config);
    }

    // Delete all configurations: For testing purposes
    public void deleteAllConfigurations() {
        DynamoDBScanExpression scanExpression = new DynamoDBScanExpression();
        List<Configuration> allConfigs = dynamoDBMapper.scan(Configuration.class, scanExpression);

        if (allConfigs.isEmpty()) {
            throw new RuntimeException("No configurations found to delete.");
        }

        dynamoDBMapper.batchDelete(allConfigs);
    }
}

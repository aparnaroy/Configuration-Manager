package com.project.backend_capstone.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBScanExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.project.backend_capstone.dto.UpdateVersionConfigRequest;
import com.project.backend_capstone.enums.CategoryStatus;
import com.project.backend_capstone.model.VersionConfiguration;

@Service
public class VersionConfigService {

    private final DynamoDBMapper dynamoDBMapper;
    private final AmazonDynamoDB amazonDynamoDB;

    @Autowired
    public VersionConfigService(DynamoDBMapper dynamoDBMapper, AmazonDynamoDB amazonDynamoDB) {
        this.dynamoDBMapper = dynamoDBMapper;
        this.amazonDynamoDB = amazonDynamoDB;
    }

    // Add a version configuration
    public void addVersionConfiguration(String configurationId, String status,
            String approvedBy, String createdBy, String description, Map<String, Object> fields) {

        // Get the latest version of the configuration to determine the next version
        // number
        Integer latestVersionNum = getLatestVersionNum(configurationId);
        Integer nextVersionNum = (latestVersionNum != null) ? latestVersionNum + 1 : 1;

        // Create a new version configuration object
        VersionConfiguration versionConfiguration = new VersionConfiguration();
        versionConfiguration.setConfigurationId(configurationId);
        versionConfiguration.setVersionNum(nextVersionNum);
        versionConfiguration.setStatus(status);
        versionConfiguration.setApprovedBy(approvedBy);
        if (approvedBy != null) {
            versionConfiguration.setApprovedDate(Instant.now().toString());
        } else {
            versionConfiguration.setApprovedDate(null);
        }
        versionConfiguration.setCreatedBy(createdBy);
        versionConfiguration.setCreatedDate(Instant.now().toString());
        versionConfiguration.setDescription(description);
        versionConfiguration.setFields(fields != null ? new HashMap<>(fields) : new HashMap<>());

        // Save the version configuration to the database
        dynamoDBMapper.save(versionConfiguration);
    }

    // Approve a configuration version
    public void approveConfiguration(String configurationId, String status,
            String approvedBy) {
        // Get the latest version of the configuration
        Integer latestVersionNum = getLatestVersionNum(configurationId);

        // Fetch all versions of the configuration
        List<VersionConfiguration> allVersions = getConfigVersions(configurationId);
        if (allVersions.isEmpty()) {
            throw new RuntimeException("No version configurations found for configurationId: " + configurationId);
        }

        // Update latest version to "Approved" and all previous versions to "Retired"
        for (VersionConfiguration version : allVersions) {
            if (version.getVersionNum().equals(latestVersionNum)) {
                if (CategoryStatus.APPROVED.getStatus().equalsIgnoreCase(version.getStatus())) {
                    throw new RuntimeException("Configuration is already approved!");
                }

                version.setStatus(CategoryStatus.APPROVED.getStatus());
                version.setApprovedBy(approvedBy);
                version.setApprovedDate(Instant.now().toString());
            } else {
                version.setStatus(CategoryStatus.RETIRED.getStatus());
            }

            dynamoDBMapper.save(version);
        }
    }

    // Helper Method: Get the latest version of a config
    private Integer getLatestVersionNum(String configurationId) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":configurationId", new AttributeValue().withS(configurationId));

        // get the latest version_num of the configuration matches the configurationId
        QueryRequest queryRequest = new QueryRequest()
                .withTableName("VersionConfiguration")
                .withKeyConditionExpression("configuration_id = :configurationId")
                .withExpressionAttributeValues(expressionValues)
                .withScanIndexForward(false)
                .withLimit(1);

        QueryResult result = amazonDynamoDB.query(queryRequest);
        if (result.getItems().isEmpty()) {
            return null;
        }

        // Get the latest version item
        Map<String, AttributeValue> latestVersionItem = result.getItems().get(0);

        return Integer.parseInt(latestVersionItem.get("version_num").getN());
    }

    // Get all versions of a specific config
    public List<VersionConfiguration> getConfigVersions(String configId) {
        VersionConfiguration versionKey = new VersionConfiguration();
        versionKey.setConfigurationId(configId);

        // Scan the table for all versions under this category
        return dynamoDBMapper.scan(VersionConfiguration.class,
                new DynamoDBScanExpression().withFilterExpression("configuration_id = :configurationId")
                        .withExpressionAttributeValues(
                                Map.of(":configurationId", new AttributeValue().withS(configId))));
    }

    // Get ALL raw config versions without caring about the model
    public List<Map<String, Object>> getALLConfigVersions() {
        ScanRequest scanRequest = new ScanRequest().withTableName("VersionConfiguration");
        ScanResult result = amazonDynamoDB.scan(scanRequest);

        List<Map<String, Object>> cleanedItems = new ArrayList<>();

        for (Map<String, AttributeValue> item : result.getItems()) {
            Map<String, Object> cleanedItem = new HashMap<>();

            for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {
                String attributeName = entry.getKey();
                AttributeValue attributeValue = entry.getValue();

                if (attributeValue.getS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getS());
                } else if (attributeValue.getN() != null) {
                    cleanedItem.put(attributeName, Integer.parseInt(attributeValue.getN()));
                } else if (attributeValue.getB() != null) {
                    cleanedItem.put(attributeName, attributeValue.getB());
                } else if (attributeValue.getSS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getSS());
                } else if (attributeValue.getNS() != null) {
                    cleanedItem.put(attributeName, attributeValue.getNS());
                } else if (attributeValue.getL() != null) {
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

    // Update a config version
    public void updateVersionConfiguration(String configId, Integer versionNum,
            UpdateVersionConfigRequest request) {
        // Load the config version from DynamoDB
        VersionConfiguration versionConfiguration = dynamoDBMapper.load(VersionConfiguration.class, configId,
                versionNum);

        if (versionConfiguration == null) {
            throw new RuntimeException(
                    "Configuration version not found for ID: " + configId + ", version: " + versionNum);
        }

        // Update allowed fields
        if (request.getStatus() != null) {
            versionConfiguration.setStatus(request.getStatus());
        }

        if (request.getApprovedBy() != null) {
            versionConfiguration.setApprovedBy(request.getApprovedBy());
            versionConfiguration.setApprovedDate(Instant.now().toString());
        }

        versionConfiguration.setDescription(request.getDescription());
        versionConfiguration.setFields(request.getFields());

        // Save the updated version
        dynamoDBMapper.save(versionConfiguration);
    }

    // Delete all version configurations: For testing purposes
    public void deleteAllVersionConfigurations() {
        DynamoDBScanExpression scanExpression = new DynamoDBScanExpression();
        List<VersionConfiguration> allVersions = dynamoDBMapper.scan(VersionConfiguration.class, scanExpression);

        if (allVersions.isEmpty()) {
            throw new RuntimeException("No version configurations found to delete.");
        }

        dynamoDBMapper.batchDelete(allVersions);
    }
}
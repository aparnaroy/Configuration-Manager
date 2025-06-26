package com.project.backend_capstone.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBScanExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.QueryRequest;
import com.amazonaws.services.dynamodbv2.model.QueryResult;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.project.backend_capstone.enums.CategoryStatus;
import com.project.backend_capstone.model.Version;

@Service
public class VersionService {
    private final DynamoDBMapper dynamoDBMapper;
    private final AmazonDynamoDB amazonDynamoDB;

    @Autowired
    public VersionService(DynamoDBMapper dynamoDBMapper, AmazonDynamoDB amazonDynamoDB) {
        this.dynamoDBMapper = dynamoDBMapper;
        this.amazonDynamoDB = amazonDynamoDB;
    }

    // Add a version
    public void addVersion(String categoryId, String description, String createdBy, String schema) {

        // Get the latest version of the category to determine the next version number
        Version latestVersion = getLatestCategoryVersion(categoryId);
        if (latestVersion == null) {
            // If no versions exist, start with version number 1
            latestVersion = new Version();
            latestVersion.setVersionNum(1); // Set to 0 to increment to 1
            latestVersion.setCategoryId(categoryId);
        } else {
            latestVersion.setVersionNum(latestVersion.getVersionNum() + 1); // Increment version number
        }
        latestVersion.setDescription(description);
        latestVersion.setSchema(schema);
        latestVersion.setVersionId(UUID.randomUUID().toString()); // Use a UUID as versionId
        latestVersion.setStatus(CategoryStatus.IN_EDITING.getStatus()); // Set status
        latestVersion.setApprovedBy(null);
        latestVersion.setApprovedDate(null);
        latestVersion.setCreatedBy(createdBy);
        latestVersion.setCreatedDate(Instant.now().toString());
        dynamoDBMapper.save(latestVersion);
    }

    // Helper Method: Get the latest version of a category
    Version getLatestCategoryVersion(String categoryId) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":categoryId", new AttributeValue().withS(categoryId));

        QueryRequest queryRequest = new QueryRequest()
                .withTableName("Version")
                .withKeyConditionExpression("category_id = :categoryId")
                .withExpressionAttributeValues(expressionValues)
                .withScanIndexForward(false) // Descending order
                .withLimit(1); // Get the most recent version

        // Use AmazonDynamoDB to query the table for more efficiency
        QueryResult result = amazonDynamoDB.query(queryRequest);
        if (result.getItems().isEmpty()) {
            return null; // If the category has no versions yet (meaning it was just created)
        }

        // Get the latest version item
        Map<String, AttributeValue> latestVersionItem = result.getItems().get(0);
        // Turn the result into a Version object
        Version latestVersion = new Version();

        latestVersion.setVersionId(latestVersionItem.get("version_id").getS());
        latestVersion.setCategoryId(latestVersionItem.get("category_id").getS());
        latestVersion.setVersionNum(Integer.parseInt(latestVersionItem.get("version_num").getN()));
        latestVersion.setDescription(
                latestVersionItem.get("description") != null ? latestVersionItem.get("description").getS() : "");
        latestVersion.setStatus(latestVersionItem.get("status") != null ? latestVersionItem.get("status").getS() : "");
        latestVersion.setApprovedBy(
                latestVersionItem.containsKey("approved_by") ? latestVersionItem.get("approved_by").getS() : null);
        latestVersion.setApprovedDate(
                latestVersionItem.containsKey("approved_date") ? latestVersionItem.get("approved_date").getS() : null);
        latestVersion.setCreatedBy(latestVersionItem.get("created_by").getS());
        latestVersion.setCreatedDate(latestVersionItem.get("created_date").getS());
        latestVersion.setSchema(latestVersionItem.containsKey("schema") ? latestVersionItem.get("schema").getS() : "");
        // latestVersion.setSchema(
        // latestVersionItem.get("schema") != null ?
        // latestVersionItem.get("schema").getS() : "hey");
        return latestVersion;
    }

    // Get all versions
    public List<Version> getAllVersions() {
        // Scan the entire Version table to get all versions (no category filter)
        return dynamoDBMapper.scan(Version.class, new DynamoDBScanExpression());
    }

    // Get all versions of a specific category
    public List<Version> getAllCategoryVersions(String categoryId) {
        Version versionKey = new Version();
        versionKey.setCategoryId(categoryId);

        // Scan the table for all versions under this category
        return dynamoDBMapper.scan(Version.class,
                new DynamoDBScanExpression().withFilterExpression("category_id = :categoryId")
                        .withExpressionAttributeValues(Map.of(":categoryId", new AttributeValue().withS(categoryId))));
    }

    // Get ALL raw versions without caring about the model
    public List<Map<String, Object>> getALLVersions() {
        ScanRequest scanRequest = new ScanRequest().withTableName("Version");
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

    // Update a version
    public void updateVersion(Version version) {
        // Update the version fields
        version.setCreatedDate(Instant.now().toString());
        dynamoDBMapper.save(version);
    }
}
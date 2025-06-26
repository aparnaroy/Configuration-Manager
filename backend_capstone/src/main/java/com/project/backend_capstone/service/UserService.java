package com.project.backend_capstone.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.AttributeValueUpdate;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.project.backend_capstone.model.User;

@Service
public class UserService {
    private final AmazonDynamoDB amazonDynamoDB;
    private final DynamoDBMapper dynamoDBMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(AmazonDynamoDB amazonDynamoDB, DynamoDBMapper dynamoDBMapper) {
        this.amazonDynamoDB = amazonDynamoDB;
        this.dynamoDBMapper = dynamoDBMapper;
        System.out.println("UserService initialized: " + amazonDynamoDB);
    }

    // Add a user
    public void register(String username, String password, List<String> role) {

        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":username", new AttributeValue().withS(username));

        ScanRequest scanRequest = new ScanRequest()
                .withTableName("Users")
                .withFilterExpression("username = :username")
                .withExpressionAttributeValues(expressionAttributeValues);

        ScanResult result = amazonDynamoDB.scan(scanRequest);

        if (!result.getItems().isEmpty()) {
            throw new RuntimeException("User already exists with username: " + username);
        }

        Set<String> roles = new HashSet<>();
        roles.add(role.get(0));

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(roles);

        dynamoDBMapper.save(user);
    }

    // Get all users
    public List<Map<String, Object>> getAllUsers() {
        ScanRequest scanRequest = new ScanRequest().withTableName("Users");
        ScanResult result = amazonDynamoDB.scan(scanRequest);

        List<Map<String, Object>> users = new ArrayList<>();
        for (Map<String, AttributeValue> item : result.getItems()) {
            Map<String, Object> user = new HashMap<>();
            user.put("username", item.get("username").getS());
            user.put("role", item.get("role").getSS());
            users.add(user);
        }

        return users;
    }

    // Get a user by username
    public Map<String, Object> getUserByUsername(String username) {
        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":username", new AttributeValue().withS(username));

        ScanRequest scanRequest = new ScanRequest()
                .withTableName("Users")
                .withFilterExpression("username = :username")
                .withExpressionAttributeValues(expressionAttributeValues);

        ScanResult result = amazonDynamoDB.scan(scanRequest);

        if (result.equals(null)) {
            return null;
        }

        Map<String, Object> user = new HashMap<>();
        if (!result.getItems().isEmpty()) {
            Map<String, AttributeValue> item = result.getItems().get(0);
            user.put("username", item.get("username").getS());
            user.put("role", item.get("role").getSS());
        }

        return user;
    }

    // Update a user's role
    public void updateUserRole(String username, String role) {
        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":username", new AttributeValue().withS(username));

        ScanRequest scanRequest = new ScanRequest()
                .withTableName("Users")
                .withFilterExpression("username = :username")
                .withExpressionAttributeValues(expressionAttributeValues);

        ScanResult result = amazonDynamoDB.scan(scanRequest);

        if (result.getItems().isEmpty()) {
            throw new RuntimeException("User does not exist with username: " + username);
        }

        String user_id = result.getItems().get(0).get("user_id").getS();

        Set<String> roles = new HashSet<>();
        roles.add(role);

        Map<String, AttributeValue> key = new HashMap<>();
        key.put("user_id", new AttributeValue().withS(user_id));

        Map<String, AttributeValueUpdate> attributeUpdates = new HashMap<>();
        attributeUpdates.put("role", new AttributeValueUpdate().withValue(new AttributeValue().withSS(roles)));

        amazonDynamoDB.updateItem("Users", key, attributeUpdates);

    }

    // Delete a user
    public void deleteUser(String username) {

        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":username", new AttributeValue().withS(username));

        ScanRequest scanRequest = new ScanRequest()
                .withTableName("Users")
                .withFilterExpression("username = :username")
                .withExpressionAttributeValues(expressionAttributeValues);

        ScanResult scanResult = amazonDynamoDB.scan(scanRequest);

        if (scanResult.getItems().isEmpty()) {
            throw new RuntimeException("User does not exist with username: " + username);
        }

        String user_id = scanResult.getItems().get(0).get("user_id").getS();

        Map<String, AttributeValue> key = new HashMap<>();
        // If username does not exist, do not delete by throwing an exception
        key.put("user_id", new AttributeValue().withS(user_id));

        amazonDynamoDB.deleteItem("Users", key);
    }
}

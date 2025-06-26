package com.project.backend_capstone.service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBScanExpression;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.spec.UpdateItemSpec;
import com.amazonaws.services.dynamodbv2.document.utils.ValueMap;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.project.backend_capstone.dto.UserGroupRequest;
import com.project.backend_capstone.model.UserGroup;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.ItemCollection;
import com.amazonaws.services.dynamodbv2.document.ScanFilter;
import com.amazonaws.services.dynamodbv2.document.ScanOutcome;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.document.spec.GetItemSpec;
import com.amazonaws.services.dynamodbv2.document.spec.ScanSpec;

@Service
public class UserGroupService {

    private final DynamoDB dynamoDB;
    private final DynamoDBMapper dynamoDBMapper;
    private final String tableName = "UserGroups";

    public UserGroupService(AmazonDynamoDB amazonDynamoDB, DynamoDBMapper dynamoDBMapper) {
        this.dynamoDB = new DynamoDB(amazonDynamoDB);
        this.dynamoDBMapper = dynamoDBMapper;
    }

    public List<Map<String, Object>> getAllUsers() throws Exception {
        try {
            Table table = dynamoDB.getTable(tableName);

            ItemCollection<ScanOutcome> items = table.scan();

            List<Map<String, Object>> userGroups = new ArrayList<>();

            for (Item item : items) {
                Map<String, Object> group = new HashMap<>();
                group.put("user_group_id", item.getString("user_group_id"));
                group.put("user_group_name", item.getString("user_group_name"));
                group.put("user_list", item.getStringSet("user_list"));
                group.put("category_access", item.getStringSet("category_access"));
                userGroups.add(group);
            }

            return userGroups;

        } catch (Exception e) {
            throw new Exception("Failed to retrieve user groups: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> searchUserGroups(String query) {
        Table table = dynamoDB.getTable(tableName);

        // Filter where user_group_name contains the query (case-sensitive)
        ScanSpec scanSpec = new ScanSpec()
                .withScanFilters(new ScanFilter("user_group_name").contains(query));

        ItemCollection<ScanOutcome> items = table.scan(scanSpec);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Item item : items) {
            Map<String, Object> group = new HashMap<>();
            group.put("user_group_id", item.getString("user_group_id"));
            group.put("user_group_name", item.getString("user_group_name"));
            group.put("user_list", item.getStringSet("user_list"));
            group.put("category_access", item.getStringSet("category_access"));
            result.add(group);
        }

        return result;
    }

    // GET: Get UserGroup by ID
    public Map<String, Object> getUserGroupById(String user_group_id) throws Exception {
        try {
            Table table = dynamoDB.getTable(tableName);

            GetItemSpec spec = new GetItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id);

            Item item = table.getItem(spec);

            if (item == null) {
                throw new Exception("User group not found with ID: " + user_group_id);
            }

            return item.asMap(); // Converts DynamoDB Item to a Map<String, Object>
        } catch (Exception e) {
            throw new Exception("Error retrieving user group by ID: " + e.getMessage());
        }
    }

    public void createUserGroup(UserGroupRequest request) {
        try {
            // Check if a group with the same name already exists
            DynamoDBScanExpression scanExpression = new DynamoDBScanExpression()
                    .withFilterExpression("user_group_name = :val1")
                    .withExpressionAttributeValues(
                            Map.of(":val1", new AttributeValue().withS(request.getUser_group_name())));

            List<UserGroup> existingGroups = dynamoDBMapper.scan(UserGroup.class, scanExpression);

            if (!existingGroups.isEmpty()) {
                throw new RuntimeException("A user group with this name already exists.");
            }

            UserGroup newGroup = new UserGroup();

            newGroup.setUser_group_id(UUID.randomUUID().toString()); // Auto-generate ID
            newGroup.setUser_group_name(request.getUser_group_name());
            newGroup.setUser_list(new HashSet<>(request.getUser_list()));
            newGroup.setCategory_access(new HashSet<>(request.getCategory_access()));

            dynamoDBMapper.save(newGroup);
        } catch (Exception e) {
            e.printStackTrace();

            if (e.getMessage().contains("A user group with this name already exists.")) {
                throw new RuntimeException("A user group with this name already exists.");
            }
            throw new RuntimeException("Failed to create user group: ", e);
        }
    }

    // This method adds a user to the group.
    public boolean addUserToGroup(String user_group_id, String user_group_name, String username) {
        try {
            Table table = dynamoDB.getTable(tableName);

            // fetch the existing user group from DynamoDB using both keys
            GetItemSpec spec = new GetItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name);
            Item item = table.getItem(spec);

            if (item == null) {
                return false;
            }

            // get the current user_list, or initialize it if it's null
            Set<String> userList = item.getStringSet("user_list");
            if (userList == null) {
                userList = new HashSet<>(); // Initialize an empty set if user_list is null
            }

            // don't add the user if they are already in the group
            if (!userList.contains(username)) {
                userList.add(username);
            } else {
                return true; // User already exists, no need to update
            }

            // update the user group in DynamoDB using both keys
            UpdateItemSpec updateSpec = new UpdateItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name)
                    .withUpdateExpression("set user_list = :u")
                    .withValueMap(new ValueMap().withStringSet(":u", userList));

            table.updateItem(updateSpec);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean removeUserFromGroup(String user_group_id, String user_group_name, String username) {
        try {
            Table table = dynamoDB.getTable(tableName);

            GetItemSpec spec = new GetItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name);
            Item item = table.getItem(spec);

            if (item == null) {
                return false;
            }

            Set<String> userList = item.getStringSet("user_list");
            if (userList == null) {
                userList = new HashSet<>();
            }

            // Check if the user exists in the list
            if (!userList.contains(username)) {
                return false;
            }

            userList.remove(username);

            UpdateItemSpec updateSpec = new UpdateItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name)
                    .withUpdateExpression("set user_list = :u")
                    .withValueMap(new ValueMap().withStringSet(":u", userList));

            table.updateItem(updateSpec);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean removeCategoryFromGroup(String user_group_id, String user_group_name, String category_id) {
        try {
            Table table = dynamoDB.getTable(tableName);

            GetItemSpec spec = new GetItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name);
            Item item = table.getItem(spec);

            if (item == null) {
                return false;
            }

            Set<String> categoryList = item.getStringSet("category_access");
            if (categoryList == null) {
                categoryList = new HashSet<>();
            }

            // Check if the category exists in the list
            if (!categoryList.contains(category_id)) {
                return false;
            }

            categoryList.remove(category_id);

            UpdateItemSpec updateSpec = new UpdateItemSpec()
                    .withPrimaryKey("user_group_id", user_group_id, "user_group_name", user_group_name)
                    .withUpdateExpression("set category_access = :c")
                    .withValueMap(new ValueMap().withStringSet(":c", categoryList));

            table.updateItem(updateSpec);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // To delete a user group -- for testing
    public boolean deleteUserGroup(String user_group_id, String user_group_name) {
        try {
            Table table = dynamoDB.getTable(tableName);

            table.deleteItem("user_group_id", user_group_id, "user_group_name", user_group_name);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // This method retrieves all user group IDs that a given user is apart of
    public List<String> getUserGroupIds(String username) {
        // List<String> userGroupIds = new ArrayList<>();

        DynamoDBScanExpression scanExpression = new DynamoDBScanExpression()
                .withFilterExpression("contains(user_list, :username)")
                .withExpressionAttributeValues(Map.of(":username", new AttributeValue().withS(username)));

        return dynamoDBMapper.scan(UserGroup.class, scanExpression).stream()
                .filter(userGroup -> userGroup.getUser_list() != null && userGroup.getUser_list().contains(username))
                .map(UserGroup::getUser_group_id)
                .collect(Collectors.toList());
    }
}

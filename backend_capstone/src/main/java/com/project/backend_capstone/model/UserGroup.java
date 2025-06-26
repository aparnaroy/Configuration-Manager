package com.project.backend_capstone.model;

import java.util.Set;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBRangeKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@DynamoDBTable(tableName = "UserGroups")
public class UserGroup {
    // Primary key (hash key) user_group_id (custom generated UUID or static)
    @DynamoDBHashKey(attributeName = "user_group_id")
    private String user_group_id;

    // Sort key user_group_name
    @DynamoDBRangeKey(attributeName = "user_group_name")
    private String user_group_name;

    // Set of user IDs in this group
    @DynamoDBAttribute(attributeName = "user_list")
    private Set<String> user_list;

    // Set of categories that this user group can access
    @DynamoDBAttribute(attributeName = "category_access")
    private Set<String> category_access;
}

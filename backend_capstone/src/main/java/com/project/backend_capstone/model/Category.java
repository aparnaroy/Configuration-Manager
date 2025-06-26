package com.project.backend_capstone.model;


import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@DynamoDBTable(tableName = "Category")
public class Category {
    // Partition Key
    @DynamoDBHashKey(attributeName = "category_id")
    private String categoryId;

    @DynamoDBAttribute(attributeName = "name")
    private String name;
}
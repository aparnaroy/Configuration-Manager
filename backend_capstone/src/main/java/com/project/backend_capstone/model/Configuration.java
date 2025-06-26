package com.project.backend_capstone.model;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBRangeKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@DynamoDBTable(tableName = "Configuration")
public class Configuration {
    @DynamoDBHashKey(attributeName = "category_id")
    private String categoryId;

    @DynamoDBRangeKey(attributeName = "configuration_id")
    private String configurationId;

    @DynamoDBAttribute(attributeName = "name")
    private String name;

    @DynamoDBAttribute(attributeName = "category_version")
    private Integer categoryVersion;
}

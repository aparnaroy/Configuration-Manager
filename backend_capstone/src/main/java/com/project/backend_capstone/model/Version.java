package com.project.backend_capstone.model;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBRangeKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@DynamoDBTable(tableName = "Version")
public class Version {
    @DynamoDBAttribute(attributeName = "version_id")
    private String versionId;

    // Partition Key
    @DynamoDBHashKey(attributeName = "category_id")
    private String categoryId;

    // Sort Key
    @DynamoDBRangeKey(attributeName = "version_num")
    private Integer versionNum;

    @DynamoDBAttribute(attributeName = "description")
    private String description;

    @DynamoDBAttribute(attributeName = "status")
    private String status;

    @DynamoDBAttribute(attributeName = "schema")
    private String schema;

    @DynamoDBAttribute(attributeName = "approved_by")
    private String approvedBy;

    @DynamoDBAttribute(attributeName = "approved_date")
    private String approvedDate;

    @DynamoDBAttribute(attributeName = "created_by")
    private String createdBy;

    @DynamoDBAttribute(attributeName = "created_date")
    private String createdDate;
}

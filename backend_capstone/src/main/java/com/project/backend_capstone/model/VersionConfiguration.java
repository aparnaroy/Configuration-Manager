package com.project.backend_capstone.model;

import java.util.Map;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBAttribute;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBHashKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBRangeKey;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTable;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBTypeConvertedJson;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@DynamoDBTable(tableName = "VersionConfiguration")
public class VersionConfiguration {
    @DynamoDBHashKey(attributeName = "configuration_id")
    private String configurationId;

    @DynamoDBRangeKey(attributeName = "version_num")
    private Integer versionNum;

    @DynamoDBAttribute(attributeName = "status")
    private String status;

    @DynamoDBAttribute(attributeName = "approved_by")
    private String approvedBy;

    @DynamoDBAttribute(attributeName = "approved_date")
    private String approvedDate;

    @DynamoDBAttribute(attributeName = "created_by")
    private String createdBy;

    @DynamoDBAttribute(attributeName = "created_date")
    private String createdDate;

    @DynamoDBAttribute(attributeName = "description")
    private String description;

    @DynamoDBTypeConvertedJson
    @DynamoDBAttribute(attributeName = "fields")
    private Map<String, Object> fields;
}

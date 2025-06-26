package com.project.backend_capstone.dto;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddConfigurationRequest {
    private String categoryId;
    private Integer categoryVersion;
    private String name;
    private String createdBy;
    private String status;
    private String description;
    private Map<String, Object> fields;
}

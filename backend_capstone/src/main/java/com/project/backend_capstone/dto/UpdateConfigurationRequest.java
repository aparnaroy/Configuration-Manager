package com.project.backend_capstone.dto;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateConfigurationRequest {
    private String categoryId;
    private String configurationId;
    private String description;
    private Map<String, Object> fields;
    private String createdBy;
}

package com.project.backend_capstone.dto;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddVersionConfigRequest {
    private String configurationId;
    private String description;
    private Map<String, Object> fields;
    private String status;
    private String approvedBy;
    private String createdBy;
}

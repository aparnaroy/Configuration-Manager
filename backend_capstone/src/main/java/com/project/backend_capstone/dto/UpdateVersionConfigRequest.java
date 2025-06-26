package com.project.backend_capstone.dto;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateVersionConfigRequest {
    private String description;
    private String status;
    private String approvedBy;
    private Map<String, Object> fields;
}
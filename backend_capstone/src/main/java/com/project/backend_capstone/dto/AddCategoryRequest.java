package com.project.backend_capstone.dto;

import java.util.Map;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddCategoryRequest {
    private String name;
    private String description;
    private String status;
    private String createdBy;
    private Map<String, Object> schema;
}
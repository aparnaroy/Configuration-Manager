package com.project.backend_capstone.dto;

import java.util.Set;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserGroupRequest {
    private String user_group_name;
    private Set<String> user_list;
    private Set<String> category_access;
}

package com.project.backend_capstone.dto;

public class AddUserToGroupRequest {
    private String user_group_id; // ID of the user group
    private String user_id; // ID of the user to add to the group

    // Constructors, getters, setters
    public AddUserToGroupRequest() {}

    public AddUserToGroupRequest(String user_group_id, String user_id) {
        this.user_group_id = user_group_id;
        this.user_id = user_id;
    }

    public String getUser_group_id() {
        return user_group_id;
    }

    public void setUser_group_id(String user_group_id) {
        this.user_group_id = user_group_id;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }
}

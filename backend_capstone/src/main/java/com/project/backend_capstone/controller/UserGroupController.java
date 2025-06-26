package com.project.backend_capstone.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.backend_capstone.dto.UserGroupRequest;
import com.project.backend_capstone.service.UserGroupService;

@RestController
@RequestMapping("/api/")
public class UserGroupController {
    @Autowired
    private UserGroupService userGroupService;


    // GET: Get all user groups
    @GetMapping("/usergroups")
    public ResponseEntity<List<Map<String, Object>>> getAllUserGroups() {
        try {
            return ResponseEntity.ok(userGroupService.getAllUsers());
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }


    // GET: Get user group by name -- would be called when the user searches in the search box in UserGroupList.tsx
    @GetMapping("/usergroups/search")
    public ResponseEntity<List<Map<String, Object>>> searchUserGroups(@RequestParam String query) {
        try {
            return ResponseEntity.ok(userGroupService.searchUserGroups(query));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }      
    }

    // GET: Get user group by id 
    @GetMapping("/usergroups/{user_group_id}")
    public ResponseEntity<Map<String, Object>> getUserGroupById(@PathVariable String user_group_id) {
        try {
            return ResponseEntity.ok(userGroupService.getUserGroupById(user_group_id));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }   
    }

     @GetMapping("/usergroups/groupIds/{username}")
    public ResponseEntity<List<String>> getUserGroupIds(@PathVariable String username) {
        try {
            List<String> groupIds = userGroupService.getUserGroupIds(username);
            return ResponseEntity.ok(groupIds);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(null);
        }
    } 


    // POST: Create new user group -- would be called when the user clicks save on the Create User Group form 
    // Only admin can create new user groups
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/usergroups")
    public ResponseEntity<String> createUserGroup(@RequestBody UserGroupRequest request) {
        try {
            userGroupService.createUserGroup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("User group created successfully.");
        } catch (Exception e) {
            e.printStackTrace(); 
            System.out.println("Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create user group.");
        }
    }


    // POST: Add a user to a specific user group
    // Only admin can add users to user groups
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/usergroups/{user_group_id}/{user_group_name}/users")
    public ResponseEntity<String> addUserToGroup(
        @PathVariable String user_group_id,
        @PathVariable String user_group_name,
        @RequestParam String username) {
    try {
        boolean success = userGroupService.addUserToGroup(user_group_id, user_group_name, username);
        if (success) {
            return ResponseEntity.ok("User added to group successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User group not found.");
        }
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add user to group.");
    }
}
    // DELETE: Remove a user from a specific user group
    // Only admin can remove users from user groups
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/usergroups/{user_group_id}/{user_group_name}/users")
    public ResponseEntity<String> removeUserFromGroup(
        @PathVariable String user_group_id,
        @PathVariable String user_group_name,
        @RequestParam String username) {
    try {
        boolean success = userGroupService.removeUserFromGroup(user_group_id, user_group_name, username);
        if (success) {
            return ResponseEntity.ok("User removed from group successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User group or user not found.");
        }
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to remove user from group.");
    }
}

    // DELETE: Remove a cateogry from a specific user group
    // Only admin can remove categories from user groups
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/usergroups/{user_group_id}/{user_group_name}/category")
    public ResponseEntity<String> removeCategoryFromGroup(
        @PathVariable String user_group_id,
        @PathVariable String user_group_name,
        @RequestParam String category_id) {
    try {
        boolean success = userGroupService.removeCategoryFromGroup(user_group_id, user_group_name, category_id);
        if (success) {
            return ResponseEntity.ok("Category removed from group successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User group or category not found.");
        }
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to remove category from group.");
    }
}

@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/usergroups/{user_group_id}/{user_group_name}")
public ResponseEntity<?> deleteUserGroup(
    @PathVariable String user_group_id,
    @PathVariable String user_group_name) {

    boolean success = userGroupService.deleteUserGroup(user_group_id, user_group_name);
    if (success) {
        return ResponseEntity.ok("User group deleted successfully.");
    } else {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                             .body("Failed to delete user group.");
    }
}
    
}

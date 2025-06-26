package com.project.backend_capstone.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.backend_capstone.dto.LoginRequest;
import com.project.backend_capstone.dto.LoginResponse;
import com.project.backend_capstone.dto.RegisterRequest;
import com.project.backend_capstone.service.UserService;
import com.project.backend_capstone.utils.JwtUtils;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    // Add a user
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @RequestBody RegisterRequest registerRequest) {
        try {
            userService.register(registerRequest.getUsername(), registerRequest.getPassword(), registerRequest.getRole());
            return ResponseEntity.ok("User added successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding user: " + e.getMessage());
        }
    }

    // Get all users
    @GetMapping("/getAllUsers")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Get a user by username
    @GetMapping("/getUserByUsername")
    public ResponseEntity<Map<String, Object>> getUserByUsername(@RequestParam String username) {
        try {
            return ResponseEntity.ok(userService.getUserByUsername(username));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Update a user's role
    // Only admin can update user role
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/updateUserRole")
    public ResponseEntity<String> updateUserRole(
            @RequestParam String username,
            @RequestParam String role) {
        try {
            userService.updateUserRole(username, role);
            return ResponseEntity.ok("User role updated successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating user role: " + e.getMessage());
        }
    }

    // Delete a user
    // Only admin can delete a user
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/deleteUser")
    public ResponseEntity<String> deleteUser(@RequestParam String username) {
        try {
            userService.deleteUser(username);
            return ResponseEntity.ok("User deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication;
        try {
            authentication = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        } catch (AuthenticationException exception) {
            Map<String, Object> map = new HashMap<>();
            map.put("message", "Bad credentials: " + exception.getMessage());
            map.put("status", false);
            return new ResponseEntity<>(map, HttpStatus.NOT_FOUND);
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String jwtToken = jwtUtils.generateTokenFromUsername(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        LoginResponse response = new LoginResponse(jwtToken, userDetails.getUsername(), roles);

        return ResponseEntity.ok(response);
    }

}

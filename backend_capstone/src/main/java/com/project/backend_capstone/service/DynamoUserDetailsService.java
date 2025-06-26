package com.project.backend_capstone.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.project.backend_capstone.model.User;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class DynamoUserDetailsService implements UserDetailsService {

    private final AmazonDynamoDB amazonDynamoDB;

    @Autowired
    public DynamoUserDetailsService(AmazonDynamoDB amazonDynamoDB) {
        this.amazonDynamoDB = amazonDynamoDB;
        System.out.println("DynamoUserDetailsService initialized: " + amazonDynamoDB);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        ScanRequest scanRequest = new ScanRequest()
                .withTableName("Users")
                .withFilterExpression("username = :username")
                .withExpressionAttributeValues(Map.of(":username", new AttributeValue().withS(username)));

        ScanResult result = amazonDynamoDB.scan(scanRequest);
        Optional<User> userOptional = result.getItems().stream()
                .map(item -> {
                    User user = new User();
                    user.setUsername(item.get("username").getS());
                    user.setPassword(item.get("password").getS());
                    user.setRole(Set.of(item.get("role").getSS().toArray(new String[0])));
                    return user;
                })
                .findFirst();

        User user = userOptional.orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().toArray(new String[0]))
                .build();
    }
}
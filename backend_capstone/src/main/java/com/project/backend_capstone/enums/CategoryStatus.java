package com.project.backend_capstone.enums;

public enum CategoryStatus {

    IN_EDITING("In Editing"),
    PENDING_APPROVAL("Pending Approval"),
    APPROVED("Approved"),
    RETIRED("Retired");

    private final String status;

    CategoryStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }
}

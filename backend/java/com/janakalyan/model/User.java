package com.janakalyan.model;

/**
 * Abstract base class shared by Member and Admin.
 * Demonstrates ENCAPSULATION (private fields + getters/setters) and
 * forms the root of the INHERITANCE hierarchy used across the app.
 */
public abstract class User {

    private String userId;
    private String fullName;
    private String email;
    private String phone;

    public User(String userId, String fullName, String email, String phone) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
    }

    public String getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    /** Every user type must describe its own dashboard summary — POLYMORPHISM. */
    public abstract String dashboardSummary();

    @Override
    public String toString() {
        return String.format("%s [%s] <%s>", fullName, userId, email != null ? email : phone);
    }
}

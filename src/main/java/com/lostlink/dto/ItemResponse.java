package com.lostlink.dto;

import com.lostlink.entity.Item;
import com.lostlink.entity.ItemStatus;
import com.lostlink.entity.ItemType;

import java.sql.Timestamp;

public class ItemResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private ItemType itemType;
    private String location;
    private ItemStatus status;
    private String imageUrl;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private Timestamp createdAt;

    public ItemResponse() {}

    public static ItemResponse fromEntity(Item item) {
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setTitle(item.getTitle());
        response.setDescription(item.getDescription());
        response.setCategory(item.getCategory());
        response.setItemType(item.getItemType());
        response.setLocation(item.getLocation());
        response.setStatus(item.getStatus());
        response.setImageUrl(item.getImageUrl());
        response.setCreatedAt(item.getCreatedAt());

        if (item.getUser() != null) {
            response.setUserId(item.getUser().getId());
            response.setUserName(item.getUser().getName());
            response.setUserEmail(item.getUser().getEmail());
            response.setUserPhone(item.getUser().getPhone());
        }
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public ItemType getItemType() { return itemType; }
    public void setItemType(ItemType itemType) { this.itemType = itemType; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}

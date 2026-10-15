package com.lostlink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.sql.Timestamp;

@Entity
@Table(
    name = "items",
    indexes = {
        @Index(name = "idx_item_type", columnList = "item_type"),
        @Index(name = "idx_item_status", columnList = "status"),
        @Index(name = "idx_item_category", columnList = "category"),
        @Index(name = "idx_item_user", columnList = "user_id")
    }
)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @NotBlank(message = "Description is required")
    @Lob
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category name must not exceed 50 characters")
    @Column(name = "category", nullable = false, length = 50)
    private String category; // e.g., Electronics, Documents, Accessories

    @NotNull(message = "Item type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 10)
    private ItemType itemType; // LOST or FOUND

    @NotBlank(message = "Location is required")
    @Size(max = 200, message = "Location must not exceed 200 characters")
    @Column(name = "location", nullable = false, length = 200)
    private String location;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private ItemStatus status = ItemStatus.OPEN; // OPEN or RESOLVED

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_item_user")
    )
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    // Default No-Argument Constructor (Required by JPA)
    public Item() {
    }

    // Constructor with essential fields
    public Item(String title, String description, String category, ItemType itemType,
                String location, ItemStatus status, String imageUrl, User user) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.itemType = itemType;
        this.location = location;
        this.status = status != null ? status : ItemStatus.OPEN;
        this.imageUrl = imageUrl;
        this.user = user;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    // All-Arguments Constructor
    public Item(Long id, String title, String description, String category, ItemType itemType,
                String location, ItemStatus status, String imageUrl, User user, Timestamp createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.itemType = itemType;
        this.location = location;
        this.status = status != null ? status : ItemStatus.OPEN;
        this.imageUrl = imageUrl;
        this.user = user;
        this.createdAt = createdAt != null ? createdAt : new Timestamp(System.currentTimeMillis());
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = new Timestamp(System.currentTimeMillis());
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public ItemType getItemType() {
        return itemType;
    }

    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    @Transient
    public String getPosterPhone() {
        return user != null ? user.getPhone() : null;
    }

    @Transient
    public String getPosterEmail() {
        return user != null ? user.getEmail() : null;
    }

    @Override
    public String toString() {
        return "Item{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", category='" + category + '\'' +
                ", itemType=" + itemType +
                ", location='" + location + '\'' +
                ", status=" + status +
                ", imageUrl='" + imageUrl + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

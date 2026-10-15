package com.lostlink.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "messages",
    indexes = {
        @Index(name = "idx_msg_item", columnList = "item_id"),
        @Index(name = "idx_msg_sender", columnList = "sender_id"),
        @Index(name = "idx_msg_receiver", columnList = "receiver_id"),
        @Index(name = "idx_msg_timestamp", columnList = "timestamp"),
        @Index(name = "idx_msg_is_read", columnList = "is_read")
    }
)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Item ID is required")
    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @NotNull(message = "Sender ID is required")
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @NotNull(message = "Receiver ID is required")
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @NotBlank(message = "Message content cannot be blank")
    @Lob
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    // Default No-Argument Constructor
    public Message() {
    }

    // Parameterized Constructor
    public Message(Long itemId, Long senderId, Long receiverId, String content) {
        this.itemId = itemId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = LocalDateTime.now();
        this.isRead = false;
    }

    // All-Arguments Constructor
    public Message(Long id, Long itemId, Long senderId, Long receiverId, String content, LocalDateTime timestamp, boolean isRead) {
        this.id = id;
        this.itemId = itemId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.isRead = isRead;
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(boolean read) {
        isRead = read;
    }

    @Override
    public String toString() {
        return "Message{" +
                "id=" + id +
                ", itemId=" + itemId +
                ", senderId=" + senderId +
                ", receiverId=" + receiverId +
                ", timestamp=" + timestamp +
                ", isRead=" + isRead +
                '}';
    }
}

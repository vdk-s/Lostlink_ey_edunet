package com.lostlink.dto;

import java.time.LocalDateTime;

public class ChatResponse {

    private String reply;
    private LocalDateTime timestamp;

    public ChatResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponse(String reply) {
        this.reply = reply;
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponse(String reply, LocalDateTime timestamp) {
        this.reply = reply;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

package com.lostlink.controller;

import com.lostlink.dto.ChatRequest;
import com.lostlink.dto.ChatResponse;
import com.lostlink.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    /**
     * Ask the LOSTLINK Expert Site Guide assistant a question.
     * Publicly accessible endpoint for all site visitors.
     */
    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> askExpertGuide(@Valid @RequestBody ChatRequest request) {
        String answer = chatbotService.getExpertGuideResponse(request.getMessage());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}

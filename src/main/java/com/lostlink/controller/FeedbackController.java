package com.lostlink.controller;

import com.lostlink.dto.FeedbackRequest;
import com.lostlink.entity.Feedback;
import com.lostlink.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /**
     * Submit user feedback and rating (1 to 5).
     * Accessible publicly or by authenticated users.
     */
    @PostMapping
    public ResponseEntity<Feedback> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        Feedback savedFeedback = feedbackService.saveFeedback(request);
        return new ResponseEntity<>(savedFeedback, HttpStatus.CREATED);
    }

    /**
     * Retrieve all feedback and ratings ordered by newest first.
     */
    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        List<Feedback> feedbackList = feedbackService.getAllFeedbacks();
        return ResponseEntity.ok(feedbackList);
    }
}

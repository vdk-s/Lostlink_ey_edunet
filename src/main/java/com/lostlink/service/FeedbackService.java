package com.lostlink.service;

import com.lostlink.dto.FeedbackRequest;
import com.lostlink.entity.Feedback;
import com.lostlink.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    /**
     * Saves a new feedback entry from a validated FeedbackRequest DTO.
     */
    @Transactional
    public Feedback saveFeedback(FeedbackRequest request) {
        Feedback feedback = new Feedback(
                request.getUserName().trim(),
                request.getEmail().trim(),
                request.getRating(),
                request.getComments() != null ? request.getComments().trim() : ""
        );
        return feedbackRepository.save(feedback);
    }

    /**
     * Saves a Feedback entity directly.
     */
    @Transactional
    public Feedback saveFeedback(Feedback feedback) {
        if (feedback.getCreatedAt() == null) {
            feedback.setCreatedAt(LocalDateTime.now());
        }
        return feedbackRepository.save(feedback);
    }

    /**
     * Fetches all feedback entries ordered by submission date (newest first).
     */
    @Transactional(readOnly = true)
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }
}

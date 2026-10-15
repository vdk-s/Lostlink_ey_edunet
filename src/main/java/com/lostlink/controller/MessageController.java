package com.lostlink.controller;

import com.lostlink.dto.MessageResponse;
import com.lostlink.dto.MessageSendRequest;
import com.lostlink.entity.Item;
import com.lostlink.entity.Message;
import com.lostlink.entity.User;
import com.lostlink.repository.ItemRepository;
import com.lostlink.repository.MessageRepository;
import com.lostlink.repository.UserRepository;
import com.lostlink.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;

    public MessageController(MessageRepository messageRepository,
                             UserRepository userRepository,
                             ItemRepository itemRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
    }

    /**
     * Helper method to extract the authenticated user's ID securely
     * from the current JWT SecurityContext.
     */
    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null) {
            authentication = SecurityContextHolder.getContext().getAuthentication();
        }

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        if (authentication.getPrincipal() instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    /**
     * Helper to transform a Message entity into an enriched MessageResponse DTO
     * containing sender name, receiver name, and item title.
     */
    private MessageResponse toResponse(Message message) {
        String senderName = userRepository.findById(message.getSenderId())
                .map(User::getName)
                .orElse("User #" + message.getSenderId());
        String receiverName = userRepository.findById(message.getReceiverId())
                .map(User::getName)
                .orElse("User #" + message.getReceiverId());
        String itemTitle = (message.getItemId() != null && message.getItemId() > 0)
                ? itemRepository.findById(message.getItemId()).map(Item::getTitle).orElse("Item #" + message.getItemId())
                : "General Inquiry";

        return MessageResponse.fromEntity(message, senderName, receiverName, itemTitle);
    }

    /**
     * POST /api/messages/send
     * Accepts a request DTO with itemId, receiverId, and content.
     * Extracts senderId securely from current JWT SecurityContext and saves to DB.
     */
    @PostMapping(value = {"/send", ""})
    @Transactional
    public ResponseEntity<MessageResponse> sendMessage(@Valid @RequestBody MessageSendRequest request,
                                                       Authentication authentication) {
        Long senderId = getAuthenticatedUserId(authentication);

        if (senderId.equals(request.getReceiverId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender cannot send messages to themselves");
        }

        if (!userRepository.existsById(request.getReceiverId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver user not found with ID: " + request.getReceiverId());
        }

        if (request.getItemId() != null && request.getItemId() > 0 && !itemRepository.existsById(request.getItemId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found with ID: " + request.getItemId());
        }

        Message message = new Message();
        message.setItemId(request.getItemId());
        message.setSenderId(senderId);
        message.setReceiverId(request.getReceiverId());
        message.setContent(request.getContent().trim());
        message.setRead(false);
        message.setTimestamp(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        return new ResponseEntity<>(toResponse(savedMessage), HttpStatus.CREATED);
    }

    /**
     * GET /api/messages/conversations or GET /api/messages/inbox or GET /api/messages
     * Returns the latest message for each conversation thread involving the current user,
     * fully populated with sender name, receiver name, and item title for message list rendering.
     */
    @GetMapping(value = {"", "/conversations", "/inbox"})
    public ResponseEntity<List<MessageResponse>> getConversations(Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        List<Message> allMessages = messageRepository.findAllByUserIdInvolved(currentUserId);

        // Group by the "other user" ID to get the latest message for each distinct conversation
        Map<Long, Message> latestPerUser = new LinkedHashMap<>();
        for (Message msg : allMessages) {
            Long otherUserId = msg.getSenderId().equals(currentUserId) ? msg.getReceiverId() : msg.getSenderId();
            if (!latestPerUser.containsKey(otherUserId)) {
                latestPerUser.put(otherUserId, msg);
            }
        }

        List<MessageResponse> responses = latestPerUser.values().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/messages/all or /api/messages/inbox-all
     * Returns all chronological messages involving the current user.
     */
    @GetMapping(value = {"/all", "/inbox-all"})
    public ResponseEntity<List<MessageResponse>> getAllMessagesForUser(Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        List<Message> messages = messageRepository.findAllByUserIdInvolved(currentUserId);
        List<MessageResponse> responses = messages.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/messages/thread/{itemId}/{otherUserId}
     * Returns the chat history between current logged-in user and the other user for that item.
     */
    @GetMapping(value = {"/thread/{itemId}/{otherUserId}", "/item/{itemId}/conversation/{otherUserId}"})
    public ResponseEntity<List<MessageResponse>> getChatThread(@PathVariable Long itemId,
                                                               @PathVariable Long otherUserId,
                                                               Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        List<Message> thread;
        if (itemId != null && itemId > 0) {
            thread = messageRepository.findChatThread(itemId, currentUserId, otherUserId);
        } else {
            thread = messageRepository.findDirectChatThread(currentUserId, otherUserId);
        }
        List<MessageResponse> responses = thread.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/messages/thread/{otherUserId}
     * Returns the chat history directly with another user across any item.
     */
    @GetMapping("/thread/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getDirectChatThread(@PathVariable Long otherUserId,
                                                                     Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        List<Message> thread = messageRepository.findDirectChatThread(currentUserId, otherUserId);
        List<MessageResponse> responses = thread.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/messages/unread
     * Returns the total count of unread messages for the currently authenticated user.
     */
    @GetMapping("/unread")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        long count = messageRepository.countByReceiverIdAndIsReadFalse(currentUserId);
        return ResponseEntity.ok(count);
    }

    /**
     * PUT /api/messages/mark-read/{itemId}/{senderId}
     * Marks unread messages in that thread as read.
     */
    @PutMapping("/mark-read/{itemId}/{senderId}")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable Long itemId,
                                                   @PathVariable Long senderId,
                                                   Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        if (itemId != null && itemId > 0) {
            messageRepository.markMessagesAsRead(itemId, senderId, currentUserId);
        } else {
            messageRepository.markAllMessagesFromSenderAsRead(senderId, currentUserId);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/messages/mark-read/{senderId}
     * Marks unread messages from a sender as read across any item.
     */
    @PutMapping("/mark-read/{senderId}")
    public ResponseEntity<Void> markDirectMessagesAsRead(@PathVariable Long senderId,
                                                         Authentication authentication) {
        Long currentUserId = getAuthenticatedUserId(authentication);
        messageRepository.markAllMessagesFromSenderAsRead(senderId, currentUserId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/messages/item/{itemId}
     * Helper endpoint to fetch all chronological messages for an item.
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<MessageResponse>> getMessagesByItem(@PathVariable Long itemId) {
        List<Message> messages = messageRepository.findByItemIdOrderByTimestampAsc(itemId);
        List<MessageResponse> responses = messages.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}

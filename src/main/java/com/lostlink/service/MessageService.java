package com.lostlink.service;

import com.lostlink.dto.MessageResponse;
import com.lostlink.dto.MessageSendRequest;
import com.lostlink.entity.Message;
import com.lostlink.entity.User;
import com.lostlink.repository.ItemRepository;
import com.lostlink.repository.MessageRepository;
import com.lostlink.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          ItemRepository itemRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional
    public MessageResponse sendMessage(MessageSendRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Sender not found with email: " + senderEmail));

        // Validate item exists
        if (!itemRepository.existsById(request.getItemId())) {
            throw new IllegalArgumentException("Item not found with id: " + request.getItemId());
        }

        // Validate receiver exists
        if (!userRepository.existsById(request.getReceiverId())) {
            throw new IllegalArgumentException("Receiver not found with id: " + request.getReceiverId());
        }

        // Prevent messaging self
        if (sender.getId().equals(request.getReceiverId())) {
            throw new IllegalArgumentException("You cannot send messages to yourself");
        }

        Message message = new Message(
                request.getItemId(),
                sender.getId(),
                request.getReceiverId(),
                request.getContent()
        );

        Message savedMessage = messageRepository.save(message);
        return MessageResponse.fromEntity(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByItem(Long itemId) {
        if (!itemRepository.existsById(itemId)) {
            throw new IllegalArgumentException("Item not found with id: " + itemId);
        }

        List<Message> messages = messageRepository.findByItemIdOrderByTimestampAsc(itemId);
        return messages.stream()
                .map(MessageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversation(Long itemId, Long otherUserId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + currentUserEmail));

        List<Message> messages = messageRepository.findChatHistory(itemId, currentUser.getId(), otherUserId);
        return messages.stream()
                .map(MessageResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

package com.lostlink.repository;

import com.lostlink.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Fetch a chat thread for a specific item between two users (ordered by timestamp ascending)
    @Query("SELECT m FROM Message m WHERE m.itemId = :itemId AND " +
           "((m.senderId = :user1Id AND m.receiverId = :user2Id) OR " +
           " (m.senderId = :user2Id AND m.receiverId = :user1Id)) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findChatThread(@Param("itemId") Long itemId,
                                 @Param("user1Id") Long user1Id,
                                 @Param("user2Id") Long user2Id);

    // Backward-compatible query to fetch conversation/chat history between two users for an item
    @Query("SELECT m FROM Message m WHERE m.itemId = :itemId AND " +
           "((m.senderId = :user1Id AND m.receiverId = :user2Id) OR " +
           " (m.senderId = :user2Id AND m.receiverId = :user1Id)) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("itemId") Long itemId,
                                  @Param("user1Id") Long user1Id,
                                  @Param("user2Id") Long user2Id);

    // Count unread messages for a specific receiver
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    // Mark messages in a specific item thread as read (messages sent by senderId to receiverId)
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.itemId = :itemId AND m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    int markMessagesAsRead(@Param("itemId") Long itemId,
                           @Param("senderId") Long senderId,
                           @Param("receiverId") Long receiverId);

    // Alternative alias for marking messages as read in a thread
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.itemId = :itemId AND m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    int markThreadMessagesAsRead(@Param("itemId") Long itemId,
                                 @Param("senderId") Long senderId,
                                 @Param("receiverId") Long receiverId);

    // Mark all unread messages as read for a receiver
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.receiverId = :receiverId AND m.isRead = false")
    int markAllAsRead(@Param("receiverId") Long receiverId);

    // Fetch all messages involving a user ordered by timestamp descending (for conversations / inbox)
    @Query("SELECT m FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId ORDER BY m.timestamp DESC")
    List<Message> findAllByUserIdInvolved(@Param("userId") Long userId);

    // Fetch conversation between two users across any item
    @Query("SELECT m FROM Message m WHERE " +
           "((m.senderId = :user1Id AND m.receiverId = :user2Id) OR " +
           " (m.senderId = :user2Id AND m.receiverId = :user1Id)) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findDirectChatThread(@Param("user1Id") Long user1Id,
                                       @Param("user2Id") Long user2Id);

    // Mark messages as read by sender regardless of itemId
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    int markAllMessagesFromSenderAsRead(@Param("senderId") Long senderId,
                                        @Param("receiverId") Long receiverId);

    // Retrieve all messages associated with an item
    List<Message> findByItemId(Long itemId);

    // Retrieve messages associated with an item ordered chronologically
    List<Message> findByItemIdOrderByTimestampAsc(Long itemId);

    // Retrieve messages where user is either the sender or receiver
    List<Message> findBySenderIdOrReceiverId(Long senderId, Long receiverId);

    // Paginated messages involving a user
    Page<Message> findBySenderIdOrReceiverIdOrderByTimestampDesc(Long senderId, Long receiverId, Pageable pageable);
}

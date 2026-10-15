package com.lostlink.repository;

import com.lostlink.entity.Item;
import com.lostlink.entity.ItemStatus;
import com.lostlink.entity.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Derived pagination query for itemType and status
    Page<Item> findByItemTypeAndStatus(ItemType itemType, ItemStatus status, Pageable pageable);

    // Derived pagination query for user's posted items
    Page<Item> findByUserId(Long userId, Pageable pageable);

    // Dynamic filtering query for itemType, status, optional category, and optional location keyword
    @Query("SELECT i FROM Item i WHERE " +
           "(:itemType IS NULL OR i.itemType = :itemType) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:locationKeyword IS NULL OR i.location LIKE CONCAT('%', :locationKeyword, '%'))")
    Page<Item> findItemsWithFilters(
            @Param("itemType") ItemType itemType,
            @Param("status") ItemStatus status,
            @Param("category") String category,
            @Param("locationKeyword") String locationKeyword,
            Pageable pageable
    );

    // Full-text keyword search across title, description, and location
    @Query("SELECT i FROM Item i WHERE " +
           "(:itemType IS NULL OR i.itemType = :itemType) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:keyword IS NULL OR " +
           " i.title LIKE CONCAT('%', :keyword, '%') OR " +
           " i.description LIKE CONCAT('%', :keyword, '%') OR " +
           " i.location LIKE CONCAT('%', :keyword, '%'))")
    Page<Item> searchItems(
            @Param("itemType") ItemType itemType,
            @Param("status") ItemStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Category-specific search
    List<Item> findByCategoryIgnoreCase(String category);
}

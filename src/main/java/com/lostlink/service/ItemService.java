package com.lostlink.service;

import com.lostlink.dto.ItemCreateRequest;
import com.lostlink.dto.ItemResponse;
import com.lostlink.entity.Item;
import com.lostlink.entity.ItemStatus;
import com.lostlink.entity.ItemType;
import com.lostlink.entity.User;
import com.lostlink.repository.ItemRepository;
import com.lostlink.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    public ItemService(ItemRepository itemRepository,
                       UserRepository userRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ItemResponse createItem(ItemCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + userEmail));

        Item item = new Item(
                request.getTitle(),
                request.getDescription(),
                request.getCategory(),
                request.getItemType(),
                request.getLocation(),
                ItemStatus.OPEN,
                request.getImageUrl(),
                user
        );

        Item savedItem = itemRepository.save(item);
        return ItemResponse.fromEntity(savedItem);
    }

    @Transactional(readOnly = true)
    public Page<ItemResponse> getItems(ItemType itemType,
                                       ItemStatus status,
                                       String category,
                                       String location,
                                       int page,
                                       int size,
                                       String sortBy,
                                       String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // Normalize blank query strings to null for JPQL parameter bindings
        String catParam = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
        String locParam = (location != null && !location.trim().isEmpty()) ? location.trim() : null;

        Page<Item> itemPage = itemRepository.findItemsWithFilters(itemType, status, catParam, locParam, pageable);

        return itemPage.map(ItemResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + id));

        return ItemResponse.fromEntity(item);
    }

    @Transactional
    public ItemResponse updateItemStatus(Long id, ItemStatus status, String userEmail) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + id));

        if (!item.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new SecurityException("Unauthorized: You can only update items that you posted");
        }

        item.setStatus(status);
        Item updatedItem = itemRepository.save(item);
        return ItemResponse.fromEntity(updatedItem);
    }
}

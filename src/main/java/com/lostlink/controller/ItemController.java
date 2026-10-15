package com.lostlink.controller;

import com.lostlink.dto.ItemCreateRequest;
import com.lostlink.dto.ItemResponse;
import com.lostlink.entity.ItemStatus;
import com.lostlink.entity.ItemType;
import com.lostlink.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    // 1a. Create a lost or found item (Authenticated - JSON Body with Base64 or URL)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody ItemCreateRequest request,
                                                   Authentication authentication) {
        String userEmail = authentication.getName();
        ItemResponse createdItem = itemService.createItem(request, userEmail);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    // 1b. Create a lost or found item (Authenticated - Multipart Form Data with file picker)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ItemResponse> createItemMultipart(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("itemType") ItemType itemType,
            @RequestParam("location") String location,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            Authentication authentication) throws IOException {

        ItemCreateRequest request = new ItemCreateRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setCategory(category);
        request.setItemType(itemType);
        request.setLocation(location);

        if (image != null && !image.isEmpty()) {
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";
            String base64Image = "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(image.getBytes());
            request.setImageUrl(base64Image);
        } else if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            request.setImageUrl(imageUrl.trim());
        }

        String userEmail = authentication.getName();
        ItemResponse createdItem = itemService.createItem(request, userEmail);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    // 2. Search / filter items with pagination
    @GetMapping
    public ResponseEntity<Page<ItemResponse>> getItems(
            @RequestParam(required = false) ItemType itemType,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Page<ItemResponse> items = itemService.getItems(
                itemType, status, category, location, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(items);
    }

    // 3. Get item details by ID
    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        ItemResponse item = itemService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    // 4. Update item status (e.g., mark as RESOLVED)
    @PatchMapping("/{id}/status")
    public ResponseEntity<ItemResponse> updateItemStatus(@PathVariable Long id,
                                                         @RequestParam ItemStatus status,
                                                         Authentication authentication) {
        String userEmail = authentication.getName();
        ItemResponse updatedItem = itemService.updateItemStatus(id, status, userEmail);
        return ResponseEntity.ok(updatedItem);
    }
}

package com.whereisit.api.controller;

import com.whereisit.api.dto.ItemDto;
import com.whereisit.api.dto.ItemRequest;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.PackingItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PackingItemController {

    private final PackingItemService itemService;

    @Autowired
    public PackingItemController(PackingItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping("/trips/{tripId}/items")
    public ResponseEntity<List<ItemDto>> getItemsByTrip(@PathVariable Long tripId,
                                                        @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(itemService.getItemsByTrip(tripId, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/trips/{tripId}/items")
    public ResponseEntity<ItemDto> addItem(@PathVariable Long tripId,
                                           @Valid @RequestBody ItemRequest itemRequest,
                                           @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(itemService.addItem(tripId, itemRequest, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ItemDto> updateItem(@PathVariable Long id,
                                              @Valid @RequestBody ItemRequest itemRequest,
                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(itemService.updateItem(id, itemRequest, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id,
                                           @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            itemService.deleteItem(id, userPrincipal.getId());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/items/{id}/pack")
    public ResponseEntity<ItemDto> togglePack(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(itemService.togglePack(id, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/items/{id}/return-pack")
    public ResponseEntity<ItemDto> toggleReturnPack(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(itemService.toggleReturnPack(id, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<ItemDto>> searchItems(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean packed,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(itemService.searchItems(userPrincipal.getId(), query, packed, category, priority));
    }

    @GetMapping("/items/find")
    public ResponseEntity<List<ItemDto>> findMyItems(
            @RequestParam String query,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(itemService.findMyItems(userPrincipal.getId(), query.trim()));
    }
}

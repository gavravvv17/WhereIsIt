package com.whereisit.api.service;

import com.whereisit.api.dto.ItemDto;
import com.whereisit.api.dto.ItemRequest;
import com.whereisit.api.entity.PackingItem;
import com.whereisit.api.entity.Trip;
import com.whereisit.api.repository.PackingItemRepository;
import com.whereisit.api.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PackingItemService {

    private final PackingItemRepository itemRepository;
    private final TripRepository tripRepository;

    @Autowired
    public PackingItemService(PackingItemRepository itemRepository, TripRepository tripRepository) {
        this.itemRepository = itemRepository;
        this.tripRepository = tripRepository;
    }

    private ItemDto convertToDto(PackingItem item) {
        return new ItemDto(
                item.getId(),
                item.getTrip().getId(),
                item.getTrip().getName(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.getPriority(),
                item.getPacked(),
                item.getReturnPacked(),
                item.getLocationRoom(),
                item.getLocationFurniture(),
                item.getLocationShelf(),
                item.getLocationDetails(),
                item.getNotes(),
                item.getPhotoUrl(),
                item.getUpdatedAt() != null ? item.getUpdatedAt() : item.getCreatedAt()
        );
    }

    public List<ItemDto> getItemsByTrip(Long tripId, Long userId) {
        tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied"));

        return itemRepository.findByTripIdOrderByCreatedAtDesc(tripId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public ItemDto getItemById(Long id, Long userId) {
        PackingItem item = itemRepository.findByIdAndTripUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found or access denied"));
        return convertToDto(item);
    }

    @Transactional
    public ItemDto addItem(Long tripId, ItemRequest request, Long userId) {
        Trip trip = tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied"));

        PackingItem item = new PackingItem();
        item.setTrip(trip);
        item.setName(request.getName());
        item.setCategory(request.getCategory());
        item.setQuantity(request.getQuantity());
        item.setPriority(request.getPriority());
        item.setPacked(request.getPacked() != null ? request.getPacked() : false);
        item.setReturnPacked(request.getReturnPacked() != null ? request.getReturnPacked() : false);
        item.setLocationRoom(request.getLocationRoom());
        item.setLocationFurniture(request.getLocationFurniture());
        item.setLocationShelf(request.getLocationShelf());
        item.setLocationDetails(request.getLocationDetails());
        item.setNotes(request.getNotes());
        item.setPhotoUrl(request.getPhotoUrl());

        PackingItem saved = itemRepository.save(item);
        return convertToDto(saved);
    }

    @Transactional
    public ItemDto updateItem(Long id, ItemRequest request, Long userId) {
        PackingItem item = itemRepository.findByIdAndTripUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found or access denied"));

        item.setName(request.getName());
        if (request.getCategory() != null) {
            item.setCategory(request.getCategory());
        }
        item.setQuantity(request.getQuantity());
        if (request.getPriority() != null) {
            item.setPriority(request.getPriority());
        }
        if (request.getPacked() != null) {
            item.setPacked(request.getPacked());
        }
        if (request.getReturnPacked() != null) {
            item.setReturnPacked(request.getReturnPacked());
        }
        item.setLocationRoom(request.getLocationRoom());
        item.setLocationFurniture(request.getLocationFurniture());
        item.setLocationShelf(request.getLocationShelf());
        item.setLocationDetails(request.getLocationDetails());
        item.setNotes(request.getNotes());
        if (request.getPhotoUrl() != null) {
            item.setPhotoUrl(request.getPhotoUrl());
        }

        PackingItem updated = itemRepository.save(item);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteItem(Long id, Long userId) {
        PackingItem item = itemRepository.findByIdAndTripUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found or access denied"));
        itemRepository.delete(item);
    }

    @Transactional
    public ItemDto togglePack(Long id, Long userId) {
        PackingItem item = itemRepository.findByIdAndTripUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found or access denied"));
        item.setPacked(!item.getPacked());
        PackingItem updated = itemRepository.save(item);
        return convertToDto(updated);
    }

    @Transactional
    public ItemDto toggleReturnPack(Long id, Long userId) {
        PackingItem item = itemRepository.findByIdAndTripUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found or access denied"));
        item.setReturnPacked(!item.getReturnPacked());
        PackingItem updated = itemRepository.save(item);
        return convertToDto(updated);
    }

    public List<ItemDto> searchItems(Long userId, String query, Boolean packed, String category, String priority) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanCategory = (category != null && !category.trim().isEmpty() && !category.equals("All")) ? category.trim() : null;
        String cleanPriority = (priority != null && !priority.trim().isEmpty() && !priority.equals("All")) ? priority.trim() : null;

        return itemRepository.searchItems(userId, cleanQuery, packed, cleanCategory, cleanPriority)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<ItemDto> findMyItems(Long userId, String query) {
        return itemRepository.findByTripUserIdAndNameContainingIgnoreCase(userId, query)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}

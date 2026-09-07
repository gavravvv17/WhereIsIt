package com.whereisit.api.dto;

import com.whereisit.api.entity.ItemPriority;
import java.time.LocalDateTime;

public class ItemDto {

    private Long id;
    private Long tripId;
    private String tripName;
    private String name;
    private String category;
    private Integer quantity;
    private ItemPriority priority;
    private Boolean packed;
    private Boolean returnPacked;
    private String locationRoom;
    private String locationFurniture;
    private String locationShelf;
    private String locationDetails;
    private String notes;
    private String photoUrl;
    private LocalDateTime updatedAt;

    public ItemDto() {}

    public ItemDto(Long id, Long tripId, String tripName, String name, String category, Integer quantity,
                   ItemPriority priority, Boolean packed, Boolean returnPacked, String locationRoom,
                   String locationFurniture, String locationShelf, String locationDetails, String notes,
                   String photoUrl, LocalDateTime updatedAt) {
        this.id = id;
        this.tripId = tripId;
        this.tripName = tripName;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.priority = priority;
        this.packed = packed;
        this.returnPacked = returnPacked;
        this.locationRoom = locationRoom;
        this.locationFurniture = locationFurniture;
        this.locationShelf = locationShelf;
        this.locationDetails = locationDetails;
        this.notes = notes;
        this.photoUrl = photoUrl;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTripId() {
        return tripId;
    }

    public void setTripId(Long tripId) {
        this.tripId = tripId;
    }

    public String getTripName() {
        return tripName;
    }

    public void setTripName(String tripName) {
        this.tripName = tripName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public ItemPriority getPriority() {
        return priority;
    }

    public void setPriority(ItemPriority priority) {
        this.priority = priority;
    }

    public Boolean getPacked() {
        return packed;
    }

    public void setPacked(Boolean packed) {
        this.packed = packed;
    }

    public Boolean getReturnPacked() {
        return returnPacked;
    }

    public void setReturnPacked(Boolean returnPacked) {
        this.returnPacked = returnPacked;
    }

    public String getLocationRoom() {
        return locationRoom;
    }

    public void setLocationRoom(String locationRoom) {
        this.locationRoom = locationRoom;
    }

    public String getLocationFurniture() {
        return locationFurniture;
    }

    public void setLocationFurniture(String locationFurniture) {
        this.locationFurniture = locationFurniture;
    }

    public String getLocationShelf() {
        return locationShelf;
    }

    public void setLocationShelf(String locationShelf) {
        this.locationShelf = locationShelf;
    }

    public String getLocationDetails() {
        return locationDetails;
    }

    public void setLocationDetails(String locationDetails) {
        this.locationDetails = locationDetails;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

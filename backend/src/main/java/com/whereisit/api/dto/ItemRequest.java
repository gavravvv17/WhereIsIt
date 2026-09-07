package com.whereisit.api.dto;

import com.whereisit.api.entity.ItemPriority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ItemRequest {

    @NotBlank
    private String name;

    private String category = "Other";

    @NotNull
    @Min(1)
    private Integer quantity = 1;

    private ItemPriority priority = ItemPriority.IMPORTANT;

    private Boolean packed = false;

    private Boolean returnPacked = false;

    private String locationRoom;
    private String locationFurniture;
    private String locationShelf;
    private String locationDetails;

    private String notes;
    private String photoUrl;

    // Getters and Setters
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
}

package com.whereisit.api.dto;

import com.whereisit.api.entity.TripStatus;
import java.time.LocalDate;

public class TripDto {

    private Long id;
    private String name;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private TripStatus status;
    private Integer totalItems;
    private Integer packedItems;
    private Integer progressPercent;

    public TripDto() {}

    public TripDto(Long id, String name, String destination, LocalDate startDate, LocalDate endDate,
                   String description, TripStatus status, Integer totalItems, Integer packedItems) {
        this.id = id;
        this.name = name;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
        this.status = status;
        this.totalItems = totalItems;
        this.packedItems = packedItems;
        this.progressPercent = (totalItems > 0) ? (int) Math.round((double) packedItems / totalItems * 100) : 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
        updateProgress();
    }

    public Integer getPackedItems() {
        return packedItems;
    }

    public void setPackedItems(Integer packedItems) {
        this.packedItems = packedItems;
        updateProgress();
    }

    public Integer getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(Integer progressPercent) {
        this.progressPercent = progressPercent;
    }

    private void updateProgress() {
        if (this.totalItems != null && this.packedItems != null && this.totalItems > 0) {
            this.progressPercent = (int) Math.round((double) this.packedItems / this.totalItems * 100);
        } else {
            this.progressPercent = 0;
        }
    }
}

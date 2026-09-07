package com.whereisit.api.dto;

public class DashboardStatsDto {

    private Integer upcomingTripsCount;
    private Integer activeTripsCount;
    private Integer itemsToPackCount;
    private Integer itemsPackedCount;
    private Integer overallProgressPercent;
    private TripDto nextUpcomingTrip;

    public DashboardStatsDto() {}

    public DashboardStatsDto(Integer upcomingTripsCount, Integer activeTripsCount, Integer itemsToPackCount,
                             Integer itemsPackedCount, TripDto nextUpcomingTrip) {
        this.upcomingTripsCount = upcomingTripsCount;
        this.activeTripsCount = activeTripsCount;
        this.itemsToPackCount = itemsToPackCount;
        this.itemsPackedCount = itemsPackedCount;
        this.nextUpcomingTrip = nextUpcomingTrip;
        
        int total = itemsToPackCount + itemsPackedCount;
        this.overallProgressPercent = (total > 0) ? (int) Math.round((double) itemsPackedCount / total * 100) : 0;
    }

    // Getters and Setters
    public Integer getUpcomingTripsCount() {
        return upcomingTripsCount;
    }

    public void setUpcomingTripsCount(Integer upcomingTripsCount) {
        this.upcomingTripsCount = upcomingTripsCount;
    }

    public Integer getActiveTripsCount() {
        return activeTripsCount;
    }

    public void setActiveTripsCount(Integer activeTripsCount) {
        this.activeTripsCount = activeTripsCount;
    }

    public Integer getItemsToPackCount() {
        return itemsToPackCount;
    }

    public void setItemsToPackCount(Integer itemsToPackCount) {
        this.itemsToPackCount = itemsToPackCount;
    }

    public Integer getItemsPackedCount() {
        return itemsPackedCount;
    }

    public void setItemsPackedCount(Integer itemsPackedCount) {
        this.itemsPackedCount = itemsPackedCount;
    }

    public Integer getOverallProgressPercent() {
        return overallProgressPercent;
    }

    public void setOverallProgressPercent(Integer overallProgressPercent) {
        this.overallProgressPercent = overallProgressPercent;
    }

    public TripDto getNextUpcomingTrip() {
        return nextUpcomingTrip;
    }

    public void setNextUpcomingTrip(TripDto nextUpcomingTrip) {
        this.nextUpcomingTrip = nextUpcomingTrip;
    }
}

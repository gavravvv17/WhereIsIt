package com.whereisit.api.controller;

import com.whereisit.api.dto.DashboardStatsDto;
import com.whereisit.api.dto.TripDto;
import com.whereisit.api.dto.TripRequest;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    @Autowired
    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public ResponseEntity<List<TripDto>> getAllTrips(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(tripService.getAllTrips(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripDto> getTripById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(tripService.getTripById(id, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<TripDto> createTrip(@Valid @RequestBody TripRequest tripRequest,
                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(tripService.createTrip(tripRequest, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripDto> updateTrip(@PathVariable Long id, @Valid @RequestBody TripRequest tripRequest,
                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(tripService.updateTrip(id, tripRequest, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            tripService.deleteTrip(id, userPrincipal.getId());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<TripDto> duplicateTrip(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(tripService.duplicateTrip(id, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(tripService.getDashboardStats(userPrincipal.getId()));
    }
}

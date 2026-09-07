package com.whereisit.api.service;

import com.whereisit.api.dto.DashboardStatsDto;
import com.whereisit.api.dto.TripDto;
import com.whereisit.api.dto.TripRequest;
import com.whereisit.api.entity.*;
import com.whereisit.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final PackingItemRepository packingItemRepository;
    private final UserRepository userRepository;
    private final PackingTemplateRepository templateRepository;
    private final TemplateItemRepository templateItemRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public TripService(TripRepository tripRepository, PackingItemRepository packingItemRepository,
                       UserRepository userRepository, PackingTemplateRepository templateRepository,
                       TemplateItemRepository templateItemRepository,
                       NotificationRepository notificationRepository) {
        this.tripRepository = tripRepository;
        this.packingItemRepository = packingItemRepository;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.templateItemRepository = templateItemRepository;
        this.notificationRepository = notificationRepository;
    }

    private TripDto convertToDto(Trip trip) {
        List<PackingItem> items = packingItemRepository.findByTripId(trip.getId());
        int totalItems = items.size();
        int packedItems = (int) items.stream().filter(PackingItem::getPacked).count();
        return new TripDto(
                trip.getId(),
                trip.getName(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getDescription(),
                trip.getStatus(),
                totalItems,
                packedItems
        );
    }

    public List<TripDto> getAllTrips(Long userId) {
        return tripRepository.findByUserIdOrderByStartDateAsc(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public TripDto getTripById(Long id, Long userId) {
        Trip trip = tripRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied"));
        return convertToDto(trip);
    }

    @Transactional
    public TripDto createTrip(TripRequest request, Long userId) {
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be yesterday or in the past");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Trip trip = new Trip();
        trip.setUser(user);
        trip.setName(request.getName());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDescription(request.getDescription());
        trip.setStatus(request.getStatus());

        Trip savedTrip = tripRepository.save(trip);

        // Pre-populate packing list from template if templateId is specified
        if (request.getTemplateId() != null) {
            PackingTemplate template = templateRepository.findById(request.getTemplateId())
                    .orElseThrow(() -> new IllegalArgumentException("Template not found"));

            List<TemplateItem> templateItems = templateItemRepository.findByTemplateId(template.getId());
            for (TemplateItem tItem : templateItems) {
                PackingItem pItem = new PackingItem();
                pItem.setTrip(savedTrip);
                pItem.setName(tItem.getName());
                pItem.setCategory(tItem.getCategory());
                pItem.setQuantity(tItem.getQuantity());
                pItem.setPriority(tItem.getPriority());
                pItem.setPacked(false);
                pItem.setReturnPacked(false);
                packingItemRepository.save(pItem);
            }
        }

        return convertToDto(savedTrip);
    }

    @Transactional
    public TripDto updateTrip(Long id, TripRequest request, Long userId) {
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be yesterday or in the past");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }

        Trip trip = tripRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied"));

        trip.setName(request.getName());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDescription(request.getDescription());
        trip.setStatus(request.getStatus());

        Trip updatedTrip = tripRepository.save(trip);
        return convertToDto(updatedTrip);
    }

    @Transactional
    public void deleteTrip(Long id, Long userId) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Delete all associated notifications and packing items first
        notificationRepository.deleteByTripId(trip.getId());
        List<PackingItem> items = packingItemRepository.findByTripId(trip.getId());
        packingItemRepository.deleteAll(items);

        tripRepository.delete(trip);
    }

    @Transactional
    public TripDto duplicateTrip(Long id, Long userId) {
        Trip originalTrip = tripRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied"));

        Trip duplicated = new Trip();
        duplicated.setUser(originalTrip.getUser());
        duplicated.setName("Copy of " + originalTrip.getName());
        duplicated.setDestination(originalTrip.getDestination());
        duplicated.setStartDate(originalTrip.getStartDate().plusYears(1));
        duplicated.setEndDate(originalTrip.getEndDate().plusYears(1));
        duplicated.setDescription(originalTrip.getDescription());
        duplicated.setStatus(TripStatus.UPCOMING);

        Trip savedDuplicated = tripRepository.save(duplicated);

        List<PackingItem> originalItems = packingItemRepository.findByTripId(originalTrip.getId());
        for (PackingItem item : originalItems) {
            PackingItem copyItem = new PackingItem();
            copyItem.setTrip(savedDuplicated);
            copyItem.setName(item.getName());
            copyItem.setCategory(item.getCategory());
            copyItem.setQuantity(item.getQuantity());
            copyItem.setPriority(item.getPriority());
            copyItem.setPacked(false);
            copyItem.setReturnPacked(false);
            copyItem.setLocationRoom(item.getLocationRoom());
            copyItem.setLocationFurniture(item.getLocationFurniture());
            copyItem.setLocationShelf(item.getLocationShelf());
            copyItem.setLocationDetails(item.getLocationDetails());
            copyItem.setNotes(item.getNotes());
            packingItemRepository.save(copyItem);
        }

        return convertToDto(savedDuplicated);
    }

    public DashboardStatsDto getDashboardStats(Long userId) {
        List<Trip> trips = tripRepository.findByUserIdOrderByStartDateAsc(userId);
        
        int upcomingCount = (int) trips.stream().filter(t -> t.getStatus() == TripStatus.UPCOMING).count();
        int activeCount = (int) trips.stream().filter(t -> t.getStatus() == TripStatus.ACTIVE).count();

        TripDto nextUpcomingTrip = trips.stream()
                .filter(t -> t.getStatus() == TripStatus.UPCOMING || t.getStatus() == TripStatus.ACTIVE)
                .min(Comparator.comparing(Trip::getStartDate))
                .map(this::convertToDto)
                .orElse(null);

        int itemsToPackCount = 0;
        int itemsPackedCount = 0;

        for (Trip trip : trips) {
            if (trip.getStatus() == TripStatus.UPCOMING || trip.getStatus() == TripStatus.ACTIVE) {
                List<PackingItem> items = packingItemRepository.findByTripId(trip.getId());
                for (PackingItem item : items) {
                    if (item.getPacked()) {
                        itemsPackedCount++;
                    } else {
                        itemsToPackCount++;
                    }
                }
            }
        }

        return new DashboardStatsDto(upcomingCount, activeCount, itemsToPackCount, itemsPackedCount, nextUpcomingTrip);
    }
}

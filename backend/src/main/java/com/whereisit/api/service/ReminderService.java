package com.whereisit.api.service;

import com.whereisit.api.entity.*;
import com.whereisit.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {

    private final TripRepository tripRepository;
    private final PackingItemRepository itemRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public ReminderService(TripRepository tripRepository, PackingItemRepository itemRepository,
                           NotificationRepository notificationRepository) {
        this.tripRepository = tripRepository;
        this.itemRepository = itemRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Scan trips on-demand for a specific user to generate reminders.
     * This avoids relying solely on background cron tasks during development.
     */
    @Transactional
    public void generateRemindersForUser(User user) {
        List<Trip> trips = tripRepository.findByUserIdAndStatusOrderByStartDateAsc(user.getId(), TripStatus.UPCOMING);
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        for (Trip trip : trips) {
            List<PackingItem> items = itemRepository.findByTripId(trip.getId());

            // 1. One day before trip reminder
            if (trip.getStartDate().equals(tomorrow)) {
                long unpackedCount = items.stream().filter(i -> !i.getPacked()).count();
                if (unpackedCount > 0) {
                    String message = String.format("⚠️ Your trip to %s is tomorrow. You still have %d items to pack!",
                            trip.getDestination(), unpackedCount);
                    
                    // Create if not already created today
                    if (!notificationExists(user.getId(), trip.getId(), message)) {
                        Notification notification = new Notification(user, trip, message, LocalDateTime.now());
                        notificationRepository.save(notification);
                    }
                }
            }

            // 2. Unpacked essential items reminder
            for (PackingItem item : items) {
                if (item.getPriority() == ItemPriority.ESSENTIAL && !item.getPacked()) {
                    String message = String.format("🔴 Don't forget your %s. It is marked as Essential and hasn't been packed yet.",
                            item.getName());

                    if (!notificationExists(user.getId(), trip.getId(), message)) {
                        Notification notification = new Notification(user, trip, message, LocalDateTime.now());
                        notificationRepository.save(notification);
                    }
                }
            }
        }
    }

    private boolean notificationExists(Long userId, Long tripId, String message) {
        // Simple duplicate prevention
        return notificationRepository.findByUserIdAndIsSentFalse(userId).stream()
                .anyMatch(n -> n.getTrip() != null && n.getTrip().getId().equals(tripId) && n.getMessage().equals(message));
    }

    /**
     * Automated cron scheduled job - Runs daily at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void scanAndGenerateReminders() {
        List<Trip> activeUpcomingTrips = tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == TripStatus.UPCOMING)
                .toList();

        for (Trip trip : activeUpcomingTrips) {
            generateRemindersForUser(trip.getUser());
        }
    }
}

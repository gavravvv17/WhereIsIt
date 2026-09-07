package com.whereisit.api.controller;

import com.whereisit.api.entity.Notification;
import com.whereisit.api.entity.User;
import com.whereisit.api.repository.UserRepository;
import com.whereisit.api.repository.NotificationRepository;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final ReminderService reminderService;
    private final UserRepository userRepository;

    @Autowired
    public NotificationController(NotificationRepository notificationRepository, ReminderService reminderService,
                                  UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.reminderService = reminderService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Trigger reminders scan dynamically on fetch to ensure they are fresh
        reminderService.generateRemindersForUser(user);

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userPrincipal.getId());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(403).build();
        }

        notification.setIsSent(true); // Treat isSent as read/dismissed
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }
}

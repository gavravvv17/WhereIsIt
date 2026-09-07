package com.whereisit.api.repository;

import com.whereisit.api.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsSentFalse(Long userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.trip.id = :tripId")
    void deleteByTripId(@Param("tripId") Long tripId);
}

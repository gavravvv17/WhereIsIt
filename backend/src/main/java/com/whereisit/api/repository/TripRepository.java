package com.whereisit.api.repository;

import com.whereisit.api.entity.Trip;
import com.whereisit.api.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByStartDateAsc(Long userId);
    List<Trip> findByUserIdAndStatusOrderByStartDateAsc(Long userId, TripStatus status);
    Optional<Trip> findByIdAndUserId(Long id, Long userId);
}

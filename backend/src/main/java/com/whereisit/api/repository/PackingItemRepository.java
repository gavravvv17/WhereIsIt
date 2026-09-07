package com.whereisit.api.repository;

import com.whereisit.api.entity.PackingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PackingItemRepository extends JpaRepository<PackingItem, Long> {
    List<PackingItem> findByTripIdOrderByCreatedAtDesc(Long tripId);
    List<PackingItem> findByTripId(Long tripId);
    Optional<PackingItem> findByIdAndTripUserId(Long id, Long userId);
    
    // Find items matching query across all trips belonging to a user
    List<PackingItem> findByTripUserIdAndNameContainingIgnoreCase(Long userId, String name);

    // Dynamic searching with multiple filters
    @Query("SELECT p FROM PackingItem p WHERE p.trip.user.id = :userId AND " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:packed IS NULL OR p.packed = :packed) AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:priority IS NULL OR p.priority = :priority)")
    List<PackingItem> searchItems(
            @Param("userId") Long userId,
            @Param("query") String query,
            @Param("packed") Boolean packed,
            @Param("category") String category,
            @Param("priority") String priority
    );
}

package com.whereisit.api.repository;

import com.whereisit.api.entity.PackingTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PackingTemplateRepository extends JpaRepository<PackingTemplate, Long> {
    
    // Fetch all user-owned templates plus global preset templates
    @Query("SELECT t FROM PackingTemplate t WHERE t.user.id = :userId OR t.user IS NULL ORDER BY t.isCustom DESC, t.name ASC")
    List<PackingTemplate> findAllAvailableTemplates(@Param("userId") Long userId);

    Optional<PackingTemplate> findByIdAndUserId(Long id, Long userId);
}

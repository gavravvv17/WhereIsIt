package com.whereisit.api.repository;

import com.whereisit.api.entity.TemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TemplateItemRepository extends JpaRepository<TemplateItem, Long> {
    List<TemplateItem> findByTemplateId(Long templateId);
    void deleteByTemplateId(Long templateId);
}

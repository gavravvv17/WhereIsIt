package com.whereisit.api.service;

import com.whereisit.api.dto.TemplateDto;
import com.whereisit.api.dto.TemplateRequest;
import com.whereisit.api.entity.*;
import com.whereisit.api.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TemplateService {

    private final PackingTemplateRepository templateRepository;
    private final TemplateItemRepository templateItemRepository;
    private final UserRepository userRepository;

    @Autowired
    public TemplateService(PackingTemplateRepository templateRepository,
                           TemplateItemRepository templateItemRepository,
                           UserRepository userRepository) {
        this.templateRepository = templateRepository;
        this.templateItemRepository = templateItemRepository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional
    public void seedDefaultTemplates() {
        List<PackingTemplate> existing = templateRepository.findAll().stream()
                .filter(t -> t.getUser() == null)
                .collect(Collectors.toList());
                
        if (!existing.isEmpty()) {
            return;
        }

        createSystemTemplate("Beach Trip", "Essential items for sand, sun, and sea.", Arrays.asList(
                new TemplateItem("Sunglasses", "Accessories", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Sunscreen", "Health & Essentials", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Swimwear", "Clothing", 2, ItemPriority.IMPORTANT),
                new TemplateItem("Towel", "Travel Gear", 1, ItemPriority.IMPORTANT),
                new TemplateItem("Slippers", "Clothing", 1, ItemPriority.IMPORTANT),
                new TemplateItem("Power Bank", "Electronics", 1, ItemPriority.IMPORTANT)
        ));

        createSystemTemplate("Mountain Trip", "Keep warm and safe at high altitudes.", Arrays.asList(
                new TemplateItem("Jacket", "Clothing", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Thermals", "Clothing", 2, ItemPriority.IMPORTANT),
                new TemplateItem("Gloves", "Clothing", 1, ItemPriority.IMPORTANT),
                new TemplateItem("Hiking Shoes", "Travel Gear", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Power Bank", "Electronics", 1, ItemPriority.IMPORTANT),
                new TemplateItem("First Aid Kit", "Health & Essentials", 1, ItemPriority.ESSENTIAL)
        ));

        createSystemTemplate("Business Trip", "Look sharp and stay connected.", Arrays.asList(
                new TemplateItem("Laptop", "Electronics", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Laptop Charger", "Electronics", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Formal Clothes", "Clothing", 3, ItemPriority.IMPORTANT),
                new TemplateItem("Identity Cards / Badges", "Documents", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Notebook", "Entertainment", 1, ItemPriority.OPTIONAL)
        ));

        createSystemTemplate("International Trip", "All you need to cross borders smoothly.", Arrays.asList(
                new TemplateItem("Passport", "Documents", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Visa Documents", "Documents", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Travel Insurance", "Documents", 1, ItemPriority.IMPORTANT),
                new TemplateItem("Universal Adapter", "Electronics", 1, ItemPriority.ESSENTIAL),
                new TemplateItem("Foreign Currency", "Documents", 1, ItemPriority.IMPORTANT),
                new TemplateItem("Phone Charger", "Electronics", 1, ItemPriority.ESSENTIAL)
        ));
    }

    private void createSystemTemplate(String name, String description, List<TemplateItem> items) {
        PackingTemplate template = new PackingTemplate();
        template.setName(name);
        template.setDescription(description);
        template.setIsCustom(false);
        template.setUser(null); // system-level

        PackingTemplate savedTemplate = templateRepository.save(template);
        for (TemplateItem item : items) {
            item.setTemplate(savedTemplate);
            templateItemRepository.save(item);
        }
    }

    private TemplateDto convertToDto(PackingTemplate template) {
        List<TemplateDto.TemplateItemDto> items = templateItemRepository.findByTemplateId(template.getId())
                .stream()
                .map(item -> new TemplateDto.TemplateItemDto(
                        item.getId(),
                        item.getName(),
                        item.getCategory(),
                        item.getQuantity(),
                        item.getPriority()
                ))
                .collect(Collectors.toList());

        return new TemplateDto(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getIsCustom(),
                items
        );
    }

    public List<TemplateDto> getAllAvailableTemplates(Long userId) {
        return templateRepository.findAllAvailableTemplates(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public TemplateDto getTemplateById(Long id, Long userId) {
        PackingTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (template.getIsCustom() && !template.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Access denied to this custom template");
        }

        return convertToDto(template);
    }

    @Transactional
    public TemplateDto createCustomTemplate(TemplateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        PackingTemplate template = new PackingTemplate();
        template.setUser(user);
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setIsCustom(true);

        PackingTemplate saved = templateRepository.save(template);

        for (TemplateRequest.TemplateItemRequest itemReq : request.getItems()) {
            TemplateItem item = new TemplateItem();
            item.setTemplate(saved);
            item.setName(itemReq.getName());
            item.setCategory(itemReq.getCategory());
            item.setQuantity(itemReq.getQuantity());
            item.setPriority(itemReq.getPriority());
            templateItemRepository.save(item);
        }

        return convertToDto(saved);
    }

    @Transactional
    public void deleteCustomTemplate(Long id, Long userId) {
        PackingTemplate template = templateRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Custom template not found or access denied"));

        templateItemRepository.deleteByTemplateId(template.getId());
        templateRepository.delete(template);
    }
}

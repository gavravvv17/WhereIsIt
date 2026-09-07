package com.whereisit.api.dto;

import com.whereisit.api.entity.ItemPriority;
import java.util.ArrayList;
import java.util.List;

public class TemplateDto {

    private Long id;
    private String name;
    private String description;
    private Boolean isCustom;
    private List<TemplateItemDto> items = new ArrayList<>();

    public TemplateDto() {}

    public TemplateDto(Long id, String name, String description, Boolean isCustom, List<TemplateItemDto> items) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isCustom = isCustom;
        this.items = items;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsCustom() {
        return isCustom;
    }

    public void setIsCustom(Boolean custom) {
        isCustom = custom;
    }

    public List<TemplateItemDto> getItems() {
        return items;
    }

    public void setItems(List<TemplateItemDto> items) {
        this.items = items;
    }

    public static class TemplateItemDto {
        private Long id;
        private String name;
        private String category;
        private Integer quantity;
        private ItemPriority priority;

        public TemplateItemDto() {}

        public TemplateItemDto(Long id, String name, String category, Integer quantity, ItemPriority priority) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.quantity = quantity;
            this.priority = priority;
        }

        // Getters and Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public ItemPriority getPriority() {
            return priority;
        }

        public void setPriority(ItemPriority priority) {
            this.priority = priority;
        }
    }
}

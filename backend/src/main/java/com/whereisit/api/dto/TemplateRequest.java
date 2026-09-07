package com.whereisit.api.dto;

import com.whereisit.api.entity.ItemPriority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class TemplateRequest {

    @NotBlank
    private String name;

    private String description;

    @Valid
    private List<TemplateItemRequest> items = new ArrayList<>();

    // Getters and Setters
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

    public List<TemplateItemRequest> getItems() {
        return items;
    }

    public void setItems(List<TemplateItemRequest> items) {
        this.items = items;
    }

    public static class TemplateItemRequest {
        @NotBlank
        private String name;

        private String category = "Other";

        @NotNull
        @Min(1)
        private Integer quantity = 1;

        private ItemPriority priority = ItemPriority.IMPORTANT;

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

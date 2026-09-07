package com.whereisit.api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "template_items")
public class TemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private PackingTemplate template;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false)
    private String category = "Other";

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity = 1;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemPriority priority = ItemPriority.IMPORTANT;

    // Default Constructor
    public TemplateItem() {}

    public TemplateItem(String name, String category, Integer quantity, ItemPriority priority) {
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

    public PackingTemplate getTemplate() {
        return template;
    }

    public void setTemplate(PackingTemplate template) {
        this.template = template;
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

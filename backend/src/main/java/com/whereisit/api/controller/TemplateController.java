package com.whereisit.api.controller;

import com.whereisit.api.dto.TemplateDto;
import com.whereisit.api.dto.TemplateRequest;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.TemplateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    @Autowired
    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<TemplateDto>> getAllAvailableTemplates(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(templateService.getAllAvailableTemplates(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateDto> getTemplateById(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(templateService.getTemplateById(id, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<TemplateDto> createCustomTemplate(@Valid @RequestBody TemplateRequest templateRequest,
                                                            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            return ResponseEntity.ok(templateService.createCustomTemplate(templateRequest, userPrincipal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomTemplate(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            templateService.deleteCustomTemplate(id, userPrincipal.getId());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

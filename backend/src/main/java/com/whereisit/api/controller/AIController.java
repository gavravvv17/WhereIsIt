package com.whereisit.api.controller;

import com.whereisit.api.dto.TemplateDto.TemplateItemDto;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    @Autowired
    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/packing-suggestions")
    public ResponseEntity<List<TemplateItemDto>> getPackingSuggestions(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        String destination = (String) request.getOrDefault("destination", "");
        String duration = (String) request.getOrDefault("duration", "");
        String description = (String) request.getOrDefault("description", "");
        
        Long tripId = null;
        Object tripIdObj = request.get("tripId");
        if (tripIdObj != null) {
            if (tripIdObj instanceof Number) {
                tripId = ((Number) tripIdObj).longValue();
            } else {
                try {
                    tripId = Long.parseLong(tripIdObj.toString());
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;

        List<TemplateItemDto> suggestions = aiService.generatePackingSuggestions(destination, duration, description, tripId, userId);
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatWithAssistant(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        String question = (String) request.getOrDefault("question", "");
        String tripContext = (String) request.getOrDefault("tripContext", "");
        
        Long tripId = null;
        Object tripIdObj = request.get("tripId");
        if (tripIdObj != null) {
            if (tripIdObj instanceof Number) {
                tripId = ((Number) tripIdObj).longValue();
            } else {
                try {
                    tripId = Long.parseLong(tripIdObj.toString());
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }

        List<Map<String, String>> history = new ArrayList<>();
        Object historyObj = request.get("history");
        if (historyObj instanceof List) {
            List<?> rawList = (List<?>) historyObj;
            for (Object item : rawList) {
                if (item instanceof Map) {
                    Map<?, ?> rawMap = (Map<?, ?>) item;
                    Map<String, String> stringMap = new HashMap<>();
                    rawMap.forEach((key, val) -> {
                        stringMap.put(String.valueOf(key), val != null ? String.valueOf(val) : null);
                    });
                    history.add(stringMap);
                }
            }
        }

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;

        String answer = aiService.answerTravelQuestion(question, tripContext, tripId, userId, history);
        Map<String, String> response = new HashMap<>();
        response.put("answer", answer);
        return ResponseEntity.ok(response);
    }
}

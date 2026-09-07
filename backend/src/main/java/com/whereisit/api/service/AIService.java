package com.whereisit.api.service;

import com.whereisit.api.dto.TemplateDto.TemplateItemDto;
import java.util.List;
import java.util.Map;

public interface AIService {
    List<TemplateItemDto> generatePackingSuggestions(String destination, String duration, String description, Long tripId, Long userId);
    String answerTravelQuestion(String question, String tripContext, Long tripId, Long userId, List<Map<String, String>> history);
}

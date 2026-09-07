package com.whereisit.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whereisit.api.dto.TemplateDto.TemplateItemDto;
import com.whereisit.api.entity.ItemPriority;
import com.whereisit.api.entity.Trip;
import com.whereisit.api.entity.PackingItem;
import com.whereisit.api.repository.TripRepository;
import com.whereisit.api.repository.PackingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIServiceImpl implements AIService {

    @Value("${ai.api-key}")
    private String apiKey;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private PackingItemRepository packingItemRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isApiKeyValid() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public List<TemplateItemDto> generatePackingSuggestions(String destination, String duration, String description, Long tripId, Long userId) {
        Trip trip = null;
        List<PackingItem> existingItems = new ArrayList<>();
        if (tripId != null && userId != null) {
            trip = tripRepository.findByIdAndUserId(tripId, userId).orElse(null);
            if (trip != null) {
                existingItems = packingItemRepository.findByTripId(tripId);
            }
        }

        if (isApiKeyValid()) {
            System.out.println("[AI] API key loaded (length=" + apiKey.trim().length() + "). Sending suggestions request to Gemini...");
            try {
                return generateSuggestionsWithGemini(destination, duration, description, trip, existingItems);
            } catch (HttpClientErrorException e) {
                System.err.println("[AI] Gemini API HTTP error " + e.getStatusCode() + " for suggestions. Response body: " + e.getResponseBodyAsString());
                System.err.println("[AI] Falling back to mock suggestions.");
            } catch (HttpServerErrorException e) {
                System.err.println("[AI] Gemini API server error " + e.getStatusCode() + " for suggestions. Response body: " + e.getResponseBodyAsString());
                System.err.println("[AI] Falling back to mock suggestions.");
            } catch (Exception e) {
                System.err.println("[AI] Gemini suggestions request failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                System.err.println("[AI] Falling back to mock suggestions.");
            }
        } else {
            System.err.println("[AI] No GEMINI_API_KEY configured. Using mock suggestions.");
        }
        return generateMockSuggestions(destination, duration, description, trip, existingItems);
    }

    @Override
    public String answerTravelQuestion(String question, String tripContext, Long tripId, Long userId, List<Map<String, String>> history) {
        Trip trip = null;
        List<PackingItem> existingItems = new ArrayList<>();
        if (tripId != null && userId != null) {
            trip = tripRepository.findByIdAndUserId(tripId, userId).orElse(null);
            if (trip != null) {
                existingItems = packingItemRepository.findByTripId(tripId);
            }
        }

        if (isApiKeyValid()) {
            System.out.println("[AI] API key loaded (length=" + apiKey.trim().length() + "). Sending chat request to Gemini...");
            try {
                return answerQuestionWithGemini(question, tripContext, trip, existingItems, history);
            } catch (HttpClientErrorException e) {
                System.err.println("[AI] Gemini API HTTP error " + e.getStatusCode() + " for chat. Response body: " + e.getResponseBodyAsString());
                System.err.println("[AI] Falling back to mock answer.");
            } catch (HttpServerErrorException e) {
                System.err.println("[AI] Gemini API server error " + e.getStatusCode() + " for chat. Response body: " + e.getResponseBodyAsString());
                System.err.println("[AI] Falling back to mock answer.");
            } catch (Exception e) {
                System.err.println("[AI] Gemini chat request failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                System.err.println("[AI] Falling back to mock answer.");
            }
        } else {
            System.err.println("[AI] No GEMINI_API_KEY configured. Using mock answer.");
        }
        return generateMockAnswer(question, tripContext);
    }

    private List<TemplateItemDto> generateSuggestionsWithGemini(
            String destination, 
            String duration, 
            String description,
            Trip trip,
            List<PackingItem> existingItems) throws Exception {
        
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Create a highly personalized, context-aware travel packing suggestion list for the following trip:\n");
        
        if (trip != null) {
            promptBuilder.append("- Destination: ").append(trip.getDestination()).append("\n");
            promptBuilder.append("- Trip Name: ").append(trip.getName()).append("\n");
            if (trip.getStartDate() != null && trip.getEndDate() != null) {
                promptBuilder.append("- Dates: ").append(trip.getStartDate()).append(" to ").append(trip.getEndDate()).append("\n");
                long days = java.time.temporal.ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
                promptBuilder.append("- Duration: ").append(days).append(" days\n");
            } else if (duration != null && !duration.trim().isEmpty()) {
                promptBuilder.append("- Duration: ").append(duration).append("\n");
            }
            if (trip.getDescription() != null && !trip.getDescription().trim().isEmpty()) {
                promptBuilder.append("- Trip Description: ").append(trip.getDescription()).append("\n");
            }
            if (description != null && !description.trim().isEmpty() && !description.equals(trip.getDescription())) {
                promptBuilder.append("- Additional Details: ").append(description).append("\n");
            }
        } else {
            promptBuilder.append("- Destination: ").append(destination).append("\n");
            promptBuilder.append("- Duration: ").append(duration).append("\n");
            promptBuilder.append("- Details: ").append(description).append("\n");
        }
        
        promptBuilder.append("\nINSTRUCTIONS:\n");
        promptBuilder.append("1. Infer the travel method (e.g. flight, driving, train), accommodation type (e.g. camping, luxury hotel, hostel), and planned activities from the trip name, description, and destination. Adjust the suggestions accordingly (e.g., trekking gear for hiking, swimwear for beaches, formalwear for business, appropriate clothing for the season/weather in the destination during those dates).\n");
        promptBuilder.append("2. Recommend items that are specific and useful for this kind of trip. Avoid generic items that are not relevant (e.g., don't suggest heavy winter jackets for a summer trip to Goa).\n");
        
        if (existingItems != null && !existingItems.isEmpty()) {
            promptBuilder.append("3. CRITICAL: The user has already added the following items to their packing list. DO NOT suggest any of these items: [");
            for (int i = 0; i < existingItems.size(); i++) {
                promptBuilder.append("\"").append(existingItems.get(i).getName().replace("\"", "\\\"")).append("\"");
                if (i < existingItems.size() - 1) {
                    promptBuilder.append(", ");
                }
            }
            promptBuilder.append("]. Only suggest new items that are not in this list.\n");
        }
        
        promptBuilder.append("4. Respond ONLY with a valid JSON array of items. Each item must have the following format:\n");
        promptBuilder.append("{\"name\":\"Item Name\",\"category\":\"Clothing|Toiletries|Electronics|Documents|Health & Essentials|Accessories|Food|Travel Gear|Entertainment|Other\",\"quantity\":1,\"priority\":\"ESSENTIAL|IMPORTANT|OPTIONAL\"}\n");
        promptBuilder.append("5. Do not include markdown wrappers (like ```json). Respond only with raw JSON.");

        String prompt = promptBuilder.toString();

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String responseStr = restTemplate.postForObject(url, entity, String.class);
        JsonNode rootNode = objectMapper.readTree(responseStr);
        String jsonText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();

        // Clean response if LLM added markdown formatting
        jsonText = jsonText.trim();
        if (jsonText.contains("[")) {
            int startIndex = jsonText.indexOf("[");
            int endIndex = jsonText.lastIndexOf("]");
            if (endIndex > startIndex) {
                jsonText = jsonText.substring(startIndex, endIndex + 1);
            }
        }

        JsonNode itemsArray = objectMapper.readTree(jsonText);
        List<TemplateItemDto> suggestions = new ArrayList<>();
        long id = 1;
        for (JsonNode itemNode : itemsArray) {
            String name = itemNode.path("name").asText();
            String category = itemNode.path("category").asText("Other");
            int quantity = itemNode.path("quantity").asInt(1);
            String priorityStr = itemNode.path("priority").asText("IMPORTANT");
            ItemPriority priority = ItemPriority.IMPORTANT;
            try {
                priority = ItemPriority.valueOf(priorityStr.toUpperCase());
            } catch (Exception e) {
                // Use default
            }

            suggestions.add(new TemplateItemDto(id++, name, category, quantity, priority));
        }

        return suggestions;
    }

    private String answerQuestionWithGemini(
            String question, 
            String tripContext, 
            Trip trip, 
            List<PackingItem> existingItems, 
            List<Map<String, String>> history) throws Exception {
        
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

        StringBuilder systemPromptBuilder = new StringBuilder();
        systemPromptBuilder.append("You are WhereIsIt, an intelligent travel assistant. You help users pack and prepare for their trips by answering questions about packing lists, travel recommendations, baggage allowances, weather, and safety.\n\n");
        
        systemPromptBuilder.append("Current Trip Context:\n");
        if (trip != null) {
            systemPromptBuilder.append("- Destination: ").append(trip.getDestination()).append("\n");
            systemPromptBuilder.append("- Trip Name: ").append(trip.getName()).append("\n");
            if (trip.getStartDate() != null && trip.getEndDate() != null) {
                systemPromptBuilder.append("- Dates: ").append(trip.getStartDate()).append(" to ").append(trip.getEndDate()).append("\n");
                long days = java.time.temporal.ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
                systemPromptBuilder.append("- Duration: ").append(days).append(" days\n");
            }
            if (trip.getDescription() != null && !trip.getDescription().trim().isEmpty()) {
                systemPromptBuilder.append("- Description: ").append(trip.getDescription()).append("\n");
            }
            if (existingItems != null && !existingItems.isEmpty()) {
                systemPromptBuilder.append("- Current Packing List Items (already added): ");
                for (int i = 0; i < existingItems.size(); i++) {
                    systemPromptBuilder.append(existingItems.get(i).getName());
                    if (i < existingItems.size() - 1) {
                        systemPromptBuilder.append(", ");
                    }
                }
                systemPromptBuilder.append("\n");
            }
        } else if (tripContext != null && !tripContext.trim().isEmpty()) {
            systemPromptBuilder.append(tripContext).append("\n");
        } else {
            systemPromptBuilder.append("No specific trip selected.\n");
        }
        
        systemPromptBuilder.append("\nProvide a helpful, travel-focused, and friendly answer. Keep it concise (less than 150 words). Do not repeat the context or mention database/technical details. Be natural and conversational.");

        String systemPrompt = systemPromptBuilder.toString();

        Map<String, Object> requestBody = new HashMap<>();
        
        // System instruction
        Map<String, Object> systemInstruction = new HashMap<>();
        Map<String, Object> sysPart = new HashMap<>();
        sysPart.put("text", systemPrompt);
        systemInstruction.put("parts", List.of(sysPart));
        requestBody.put("systemInstruction", systemInstruction);

        // Contents (history + current question)
        List<Map<String, Object>> contents = new ArrayList<>();
        
        if (history != null && !history.isEmpty()) {
            boolean foundFirstUser = false;
            for (Map<String, String> msg : history) {
                String role = msg.get("role");
                String text = msg.get("text");
                if (role == null || text == null || text.trim().isEmpty()) {
                    continue;
                }
                
                String geminiRole = "user";
                if ("assistant".equalsIgnoreCase(role) || "model".equalsIgnoreCase(role)) {
                    geminiRole = "model";
                }
                
                // Gemini requires the first turn to be 'user'
                if (!foundFirstUser) {
                    if ("model".equals(geminiRole)) {
                        continue; // Skip assistant greeting at the start
                    } else {
                        foundFirstUser = true;
                    }
                }
                
                Map<String, Object> contentMap = new HashMap<>();
                contentMap.put("role", geminiRole);
                
                Map<String, Object> partMap = new HashMap<>();
                partMap.put("text", text);
                contentMap.put("parts", List.of(partMap));
                
                contents.add(contentMap);
            }
        }

        // If history was empty or didn't contain any user messages, fallback to just the current question
        if (contents.isEmpty()) {
            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("role", "user");
            
            Map<String, Object> partMap = new HashMap<>();
            partMap.put("text", question);
            contentMap.put("parts", List.of(partMap));
            
            contents.add(contentMap);
        }

        requestBody.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String responseStr = restTemplate.postForObject(url, entity, String.class);
        JsonNode rootNode = objectMapper.readTree(responseStr);
        return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
    }

    private List<TemplateItemDto> generateMockSuggestions(String destination, String duration, String description, Trip trip, List<PackingItem> existingItems) {
        String destStr = (trip != null) ? trip.getDestination() : destination;
        if (destStr == null) destStr = "";
        
        List<TemplateItemDto> allMock = generateMockSuggestionsRaw(destStr, duration, description);
        
        if (existingItems != null && !existingItems.isEmpty()) {
            List<TemplateItemDto> filtered = new ArrayList<>();
            for (TemplateItemDto item : allMock) {
                boolean exists = false;
                for (PackingItem existing : existingItems) {
                    if (existing.getName().trim().equalsIgnoreCase(item.getName().trim())) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    filtered.add(item);
                }
            }
            return filtered;
        }
        return allMock;
    }

    private List<TemplateItemDto> generateMockSuggestionsRaw(String destination, String duration, String description) {
        List<TemplateItemDto> list = new ArrayList<>();
        String dest = destination.toLowerCase();

        long id = 1;
        if (dest.contains("beach") || dest.contains("goa") || dest.contains("bali") || dest.contains("phuket")) {
            list.add(new TemplateItemDto(id++, "Sunscreen (SPF 50+)", "Health & Essentials", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Polarized Sunglasses", "Accessories", 1, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "Quick Dry Swimshorts", "Clothing", 2, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "Beach Towel", "Travel Gear", 1, ItemPriority.OPTIONAL));
            list.add(new TemplateItemDto(id++, "Waterproof Phone Pouch", "Electronics", 1, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "Slippers / Flip-flops", "Clothing", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Power Bank", "Electronics", 1, ItemPriority.ESSENTIAL));
        } else if (dest.contains("mountain") || dest.contains("ladakh") || dest.contains("hiking") || dest.contains("trek")) {
            list.add(new TemplateItemDto(id++, "Heavy Windproof Jacket", "Clothing", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Thermal Innerwear", "Clothing", 2, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Hiking Shoes", "Travel Gear", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Woolen Socks & Gloves", "Clothing", 2, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "First Aid & Altitude Pills", "Health & Essentials", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Power Bank 20000mAh", "Electronics", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Thermos Water Flask", "Travel Gear", 1, ItemPriority.IMPORTANT));
        } else if (dest.contains("work") || dest.contains("business") || dest.contains("meeting") || dest.contains("conference")) {
            list.add(new TemplateItemDto(id++, "Laptop & Charger", "Electronics", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Formal Blazer & Shirts", "Clothing", 3, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Business Cards", "Documents", 50, ItemPriority.OPTIONAL));
            list.add(new TemplateItemDto(id++, "Notebook and Pen", "Entertainment", 1, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "Universal Adapter", "Electronics", 1, ItemPriority.IMPORTANT));
        } else {
            // General fallback suggestion
            list.add(new TemplateItemDto(id++, "Passport & Copies", "Documents", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Universal Power Adapter", "Electronics", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Travel Toothbrush Kit", "Toiletries", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "Comfortable Walking Shoes", "Clothing", 1, ItemPriority.ESSENTIAL));
            list.add(new TemplateItemDto(id++, "T-Shirts", "Clothing", 5, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "First Aid Basics", "Health & Essentials", 1, ItemPriority.IMPORTANT));
            list.add(new TemplateItemDto(id++, "Noise Cancelling Earbuds", "Electronics", 1, ItemPriority.OPTIONAL));
        }
        return list;
    }

    private String generateMockAnswer(String question, String tripContext) {
        String q = question.toLowerCase();
        if (q.contains("pack") || q.contains("what should I")) {
            return "Based on your trip details, you should prioritize packing essential documents (Passport/ID), matching electronics (chargers/power bank), and weather-appropriate layers. Refer to your generated suggestions list for specifics.";
        } else if (q.contains("cabin") || q.contains("flight") || q.contains("bag")) {
            return "In your cabin bag, keep essentials: Passport, boarding passes, wallet, prescription medications, phone, charger, power bank, and a change of clothes in case checked baggage is delayed.";
        } else if (q.contains("weather") || q.contains("climate")) {
            return "Be sure to check local forecasts 24 hours before leaving. We recommend packing a light outer shell for rain and versatile layers to adjust to temperature swings.";
        } else {
            return "That's a great question! For your trip, make sure you double-check your checklist status on the WhereIsIt dashboard. Let me know if you need specific advice on baggage allowance or location safety.";
        }
    }
}

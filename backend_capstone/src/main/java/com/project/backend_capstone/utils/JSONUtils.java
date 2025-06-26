package com.project.backend_capstone.utils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;

public class JSONUtils {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static String serialize(Object obj) throws JsonProcessingException {
        return mapper.writeValueAsString(obj);
    }

    public static <T> T deserialize(String json, Class<T> clazz) throws IOException {
        return mapper.readValue(json, clazz);
    }
    
    public static Map<String, Object> deserializeToMap(String json) throws IOException {
        return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
    }
    
}

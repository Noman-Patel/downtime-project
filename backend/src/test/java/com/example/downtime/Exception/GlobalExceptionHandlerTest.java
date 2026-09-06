package com.example.downtime.Exception;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void invalidDowntimeDateRangeReturnsBadRequest() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleInvalidDowntimeDateRange(
                        new InvalidDowntimeDateRangeException(
                                "Resolved at cannot be earlier than occurred at"
                        )
                );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("Bad Request", response.getBody().get("error"));
        assertEquals(
                "Resolved at cannot be earlier than occurred at",
                response.getBody().get("message")
        );
    }

    @Test
    void deletingReferencedMachineReturnsHelpfulConflict() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("DELETE", "/api/machines/7");

        ResponseEntity<Map<String, Object>> response =
                handler.handleDataIntegrityViolation(
                        new DataIntegrityViolationException("foreign key violation"),
                        request
                );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().get("status"));
        assertEquals("Conflict", response.getBody().get("error"));
        assertTrue(
                String.valueOf(response.getBody().get("message"))
                        .contains("downtime events still reference it")
        );
    }
}

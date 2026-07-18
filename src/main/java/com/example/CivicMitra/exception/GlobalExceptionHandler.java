package com.example.CivicMitra.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 1. DTO field validation failures (@Valid on @RequestBody) ─────────
    // Returns: { "status": 400, "error": "Validation failed...", "fields": { "phoneNumber": "..." } }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation failed. Please fix the following fields.");
        body.put("fields", fieldErrors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }


    // ── 2. JPA entity-level constraint violations ─────────────────────────
    // Catches any constraints that still fire at persist time
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> messages = ex.getConstraintViolations().stream()
                .map(cv -> {
                    String field = cv.getPropertyPath().toString();
                    if (field.contains(".")) {
                        field = field.substring(field.lastIndexOf('.') + 1);
                    }
                    return field + ": " + cv.getMessage();
                })
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "One or more fields have invalid values.");
        body.put("details", messages);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ── 3. Invalid JSON / unrecognized enum values in request body ─────────
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        String message = "Invalid request body.";
        String cause = ex.getMostSpecificCause().getMessage();
        if (cause != null && cause.contains("not one of the values accepted for Enum class")) {
            message = "Invalid role value. Accepted roles: CITIZEN, WORKER, AUTHORITY, MUNICIPAL_ADMIN, MUNICIPALITY_PARTNER, SYSTEM_SUPER_ADMIN.";
        } else if (cause != null) {
            message = "Invalid request format: " + cause.split("\\n")[0];
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", message);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ── 4. Business logic errors (e.g. "Email already registered") ────────
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ── 5. Resource not found ─────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", ex.getMessage());
        body.put("timestamp", LocalDateTime.now().toString());

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    // ── 6. Access denied ──────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "You do not have permission to access this resource.");

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    // ── 7. Catch-all ──────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralError(Exception ex) {
        ex.printStackTrace();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "An unexpected error occurred. Please try again later.");

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

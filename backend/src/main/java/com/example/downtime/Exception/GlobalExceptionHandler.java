package com.example.downtime.Exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .getFirst()
                .getDefaultMessage();

        return errorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(InvalidDowntimeDateRangeException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidDowntimeDateRange(
            InvalidDowntimeDateRangeException exception) {
        return errorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception) {
        String suppliedValue = String.valueOf(exception.getValue());
        String message = "Invalid value '%s' for parameter '%s'%s."
                .formatted(
                        suppliedValue,
                        exception.getName(),
                        expectedValueDescription(exception.getRequiredType()));

        return errorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request) {
        String message = dataIntegrityMessage(request);
        return errorResponse(HttpStatus.CONFLICT, message);
    }

    @ExceptionHandler(ProductionLineNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleProductionLineNotFound(
            ProductionLineNotFoundException exception) {
        return errorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }



    @ExceptionHandler(MachineNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleMachineNotFound(
            MachineNotFoundException exception) {
        return errorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }


    @ExceptionHandler(DowntimeEventNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDowntimeEventNotFound(
            DowntimeEventNotFoundException exception) {
        return errorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }


    @ExceptionHandler(DowntimeReasonNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDowntimeReasonNotFound(
            DowntimeReasonNotFoundException exception) {
        return errorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }


    @ExceptionHandler(DepartmentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDepartmentNotFound(
            DepartmentNotFoundException exception) {
        return errorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    private ResponseEntity<Map<String, Object>> errorResponse(
            HttpStatus status,
            String message) {
        Map<String, Object> response = Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message);

        return ResponseEntity.status(status).body(response);
    }

    private String expectedValueDescription(Class<?> requiredType) {
        if (requiredType == null) {
            return "";
        }

        if (requiredType.isEnum()) {
            String allowedValues = Arrays.stream(requiredType.getEnumConstants())
                    .map(String::valueOf)
                    .collect(Collectors.joining(", "));
            return ". Expected one of: " + allowedValues;
        }

        if (requiredType == LocalDateTime.class) {
            return ". Expected an ISO date and time such as 2026-09-06T14:30:00";
        }

        if (Number.class.isAssignableFrom(requiredType)) {
            return ". Expected a numeric ID";
        }

        return "";
    }

    private String dataIntegrityMessage(HttpServletRequest request) {
        if (!"DELETE".equalsIgnoreCase(request.getMethod())) {
            return "The request conflicts with existing data. Check the submitted values and try again.";
        }

        String path = request.getRequestURI();
        if (path.contains("/departments/")) {
            return "This department cannot be deleted because production lines still reference it. Reassign or delete those production lines first.";
        }
        if (path.contains("/production-lines/")) {
            return "This production line cannot be deleted because machines still reference it. Reassign or delete those machines first.";
        }
        if (path.contains("/machines/")) {
            return "This machine cannot be deleted because downtime events still reference it. Preserve or reassign its fault history before deleting the machine.";
        }
        if (path.contains("/downtime-reasons/")) {
            return "This downtime reason cannot be deleted because downtime events still reference it.";
        }

        return "This record cannot be deleted because other records still reference it.";
    }


}

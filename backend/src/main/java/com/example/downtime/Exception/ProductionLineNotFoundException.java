package com.example.downtime.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProductionLineNotFoundException extends RuntimeException {

    public ProductionLineNotFoundException(Long id) {
        super("Production line not found with id: " + id);
    }
}
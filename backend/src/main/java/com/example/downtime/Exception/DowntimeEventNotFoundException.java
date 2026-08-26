package com.example.downtime.Exception;

public class DowntimeEventNotFoundException extends RuntimeException {

    public DowntimeEventNotFoundException(Long id) {
        super("Downtime event not found with id: " + id);
    }
}
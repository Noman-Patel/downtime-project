package com.example.downtime.Exception;

public class MachineNotFoundException extends RuntimeException {

    public MachineNotFoundException(Long id) {
        super("Machine not found with id: " + id);
    }
}
package com.example.downtime.Exception;

public class UserOperationNotAllowedException extends RuntimeException {

    public UserOperationNotAllowedException(String message) {
        super(message);
    }
}

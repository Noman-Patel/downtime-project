package com.example.downtime.Exception;

public class DowntimeReasonNotFoundException extends RuntimeException {

  public DowntimeReasonNotFoundException(Long id) {
    super("Downtime reason not found with id: " + id);
  }
}
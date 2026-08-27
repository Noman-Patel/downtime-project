package com.example.downtime.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public class DowntimeEventRequestDTO {

    @NotNull(message = "Machine ID is required")
    @Positive(message = "Machine ID must be greater than 0")
    private Long machineId;
    private Long downtimeReasonId;

    @NotBlank(message = "Fault reason is required")
    private String faultReason;
    private String description;

    @NotNull(message = "Occurred at is required")
    private LocalDateTime occurredAt;
    private LocalDateTime resolvedAt;

    public Long getMachineId() {
        return machineId;
    }

    public void setMachineId(Long machineId) {
        this.machineId = machineId;
    }

    public Long getDowntimeReasonId() {
        return downtimeReasonId;
    }

    public void setDowntimeReasonId(Long downtimeReasonId) {
        this.downtimeReasonId = downtimeReasonId;
    }

    public String getFaultReason() {
        return faultReason;
    }

    public void setFaultReason(String faultReason) {
        this.faultReason = faultReason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}